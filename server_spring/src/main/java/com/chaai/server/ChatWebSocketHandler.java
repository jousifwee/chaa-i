package com.chaai.server;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper mapper = new ObjectMapper();
    private final Map<String, WebSocketSession> clients = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> rooms = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        // nothing
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode node = parse(message.getPayload());
        if (node == null || !node.has("type")) return;

        String type = node.get("type").asText("");
        switch (type) {
            case "join" -> handleJoin(session, node);
            case "msg" -> handleMsg(session, node);
            case "leave" -> handleLeave(session, node);
            default -> { /* ignore */ }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userId = (String) session.getAttributes().getOrDefault("userId", "");
        if (!userId.isEmpty()) {
            clients.remove(userId);
            for (Set<String> s : rooms.values()) s.remove(userId);
        }
    }

    private void handleJoin(WebSocketSession session, JsonNode node) {
        JsonNode uidNode = node.get("userId");
        if (uidNode == null || !uidNode.isTextual()) return;
        String userId = uidNode.asText();
        session.getAttributes().put("userId", userId);
        clients.put(userId, session);

        JsonNode roomsNode = node.get("rooms");
        if (roomsNode != null && roomsNode.isArray()) {
            for (JsonNode r : roomsNode) {
                if (!r.isTextual()) continue;
                String room = r.asText();
                rooms.computeIfAbsent(room, k -> new CopyOnWriteArraySet<>()).add(userId);
            }
        }
        // optionally send presence event
    }

    private void handleMsg(WebSocketSession session, JsonNode node) throws IOException {
        String userId = (String) session.getAttributes().getOrDefault("userId", "");
        if (node.has("to") && node.get("to").isTextual()) {
            String to = node.get("to").asText();
            WebSocketSession dst = clients.get(to);
            if (dst != null && dst.isOpen()) dst.sendMessage(new TextMessage(node.toString()));
        } else if (node.has("room") && node.get("room").isTextual()) {
            String room = node.get("room").asText();
            Set<String> members = rooms.get(room);
            if (members != null) {
                for (String u : members) {
                    if (u.equals(userId)) continue;
                    WebSocketSession dst = clients.get(u);
                    if (dst != null && dst.isOpen()) dst.sendMessage(new TextMessage(node.toString()));
                }
            }
        }
    }

    private void handleLeave(WebSocketSession session, JsonNode node) {
        String userId = (String) session.getAttributes().getOrDefault("userId", "");
        JsonNode roomsNode = node.get("rooms");
        if (roomsNode != null && roomsNode.isArray()) {
            for (JsonNode r : roomsNode) {
                if (!r.isTextual()) continue;
                Set<String> s = rooms.get(r.asText());
                if (s != null) s.remove(userId);
            }
        }
    }

    private JsonNode parse(String json) {
        try { return mapper.readTree(json); }
        catch (Exception ignored) { return null; }
    }
}

