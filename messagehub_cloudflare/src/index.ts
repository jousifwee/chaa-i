import { Hono } from "hono";
import { cors } from "hono/cors";

const MAX_MESSAGE_BYTES = 64 * 1024; // 64 KiB to stay below Cloudflare payload limits

export type Env = {
  CHANNEL: DurableObjectNamespace;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

app.get("/", (c) => c.json({ status: "ok", runtime: "cloudflare" }));
app.get("/health", (c) => c.text("ok"));

app.get("/ws/:roomId", (c) => {
  const roomId = c.req.param("roomId");
  const stub = c.env.CHANNEL.get(c.env.CHANNEL.idFromName(roomId));
  return stub.fetch(c.req.raw);
});

app.post("/rooms/:roomId/messages", async (c) => {
  const roomId = c.req.param("roomId");
  const contentLength = c.req.header("content-length");

  if (contentLength && Number(contentLength) > MAX_MESSAGE_BYTES) {
    return c.json({ error: `content-length exceeds ${MAX_MESSAGE_BYTES} bytes limit` }, 413);
  }

  const rawBody = await c.req.arrayBuffer();

  if (rawBody.byteLength === 0) {
    return c.json({ error: "message body required" }, 400);
  }

  if (rawBody.byteLength > MAX_MESSAGE_BYTES) {
    return c.json({ error: `message exceeds ${MAX_MESSAGE_BYTES} bytes limit` }, 413);
  }

  const stub = c.env.CHANNEL.get(c.env.CHANNEL.idFromName(roomId));
  const forwardRequest = new Request(c.req.url, {
    method: "POST",
    headers: {
      "content-type": c.req.header("content-type") ?? "text/plain",
      "x-messagehub-action": "broadcast",
    },
    body: rawBody,
  });

  return stub.fetch(forwardRequest);
});

export default {
  fetch: app.fetch,
};

export class ChannelDurableObject {
  private readonly sockets = new Map<string, WebSocket>();
  private readonly encoder = new TextEncoder();

  constructor(private readonly state: DurableObjectState, private readonly _env: Env) {}

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get("Upgrade") || request.headers.get("upgrade");

    if (upgradeHeader === "websocket") {
      return this.handleWebSocket(request);
    }

    if (request.method === "POST") {
      const action = request.headers.get("x-messagehub-action");
      if (action === "broadcast") {
        const contentLength = request.headers.get("content-length");
        if (contentLength && Number(contentLength) > MAX_MESSAGE_BYTES) {
          return new Response(
            JSON.stringify({ error: `content-length exceeds ${MAX_MESSAGE_BYTES} bytes limit` }),
            {
              status: 413,
              headers: { "content-type": "application/json" },
            },
          );
        }

        const payload = await request.arrayBuffer();
        if (payload.byteLength > MAX_MESSAGE_BYTES) {
          return new Response(
            JSON.stringify({ error: `message exceeds ${MAX_MESSAGE_BYTES} bytes limit` }),
            {
              status: 413,
              headers: { "content-type": "application/json" },
            },
          );
        }

        this.broadcast(payload);
        return new Response(null, { status: 202 });
      }
    }

    return new Response("Not found", { status: 404 });
  }

  private handleWebSocket(request: Request): Response {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    const connectionId = crypto.randomUUID();
    this.sockets.set(connectionId, server);

    server.accept();

    const onMessage = (event: MessageEvent) => {
      const data = typeof event.data === "string" ? this.encoder.encode(event.data) : new Uint8Array(event.data as ArrayBuffer);

      if (data.byteLength > MAX_MESSAGE_BYTES) {
        server.close(1009, `message exceeds ${MAX_MESSAGE_BYTES} bytes`);
        return;
      }

      this.broadcast(data.buffer, connectionId);
    };

    const cleanup = () => {
      server.removeEventListener("message", onMessage);
      server.removeEventListener("close", cleanup);
      server.removeEventListener("error", cleanup);
      this.sockets.delete(connectionId);
    };

    server.addEventListener("message", onMessage);
    server.addEventListener("close", cleanup);
    server.addEventListener("error", cleanup);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private broadcast(payload: ArrayBuffer, senderId?: string) {
    for (const [id, socket] of this.sockets.entries()) {
      if (senderId && id === senderId) continue;
      try {
        socket.send(payload);
      } catch (error) {
        console.warn("failed to send payload", error);
        socket.close(1011, "broadcast failure");
        this.sockets.delete(id);
      }
    }
  }
}
