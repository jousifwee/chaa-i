package com.chaai.server;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper mapper = new ObjectMapper();
    private final Map<String, WebSocketSession> clients = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> rooms = new ConcurrentHashMap<>();
    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketHandler.class);

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("WebSocket connection established: sessionId={}, uri={}", session.getId(), session.getUri());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode node = parse(message.getPayload());
        if (node == null) {
            log.warn("Ignoring unparsable payload from session {}", session.getId());
            return;
        }
        if (!node.has("type")) {
            log.warn("Ignoring message without type from session {}", session.getId());
            return;
        }

        String type = node.get("type").asText("");
        log.debug("Received message of type {} from session {}", type, session.getId());
        switch (type) {
            case "join" -> handleJoin(session, node);
            case "msg" -> handleMsg(session, node);
            case "leave" -> handleLeave(session, node);
            default -> log.debug("Unsupported message type {} from session {}", type, session.getId());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userId = (String) session.getAttributes().getOrDefault("userId", "");
        log.info("WebSocket connection closed: sessionId={}, userId={}, status={}", session.getId(), userId, status);
        if (!userId.isEmpty()) {
            clients.remove(userId);
            for (Set<String> s : rooms.values()) s.remove(userId);
        }
    }

    private void handleJoin(WebSocketSession session, JsonNode node) {
        JsonNode uidNode = node.get("userId");
        if (uidNode == null || !uidNode.isTextual()) {
            log.warn("Join event without userId from session {}", session.getId());
            return;
        }
        String userId = uidNode.asText();
        session.getAttributes().put("userId", userId);
        clients.put(userId, session);

        JsonNode roomsNode = node.get("rooms");
        List<String> joinedRooms = new ArrayList<>();
        if (roomsNode != null && roomsNode.isArray()) {
            for (JsonNode r : roomsNode) {
                if (!r.isTextual()) continue;
                String room = r.asText();
                rooms.computeIfAbsent(room, k -> new CopyOnWriteArraySet<>()).add(userId);
                joinedRooms.add(room);
            }
        }
        if (joinedRooms.isEmpty()) {
            log.info("User {} joined without rooms (sessionId={})", userId, session.getId());
        } else {
            log.info("User {} joined rooms {} (sessionId={})", userId, joinedRooms, session.getId());
        }
    }

    private void handleMsg(WebSocketSession session, JsonNode node) throws IOException {
        String userId = (String) session.getAttributes().getOrDefault("userId", "");
        if (node.has("to") && node.get("to").isTextual()) {
            String to = node.get("to").asText();
            WebSocketSession dst = clients.get(to);
            if (dst != null && dst.isOpen()) {
                log.debug("Routing direct message from {} to {}", userId, to);
                dst.sendMessage(new TextMessage(node.toString()));
            } else {
                log.warn("Unable to deliver direct message from {} to {} (session not available)", userId, to);
            }
        } else if (node.has("room") && node.get("room").isTextual()) {
            String room = node.get("room").asText();
            Set<String> members = rooms.get(room);
            if (members != null) {
                log.debug("Routing room message from {} to room {} ({} members)", userId, room, members.size());
                for (String u : members) {
                    if (u.equals(userId)) continue;
                    WebSocketSession dst = clients.get(u);
                    if (dst != null && dst.isOpen()) {
                        dst.sendMessage(new TextMessage(node.toString()));
                    } else {
                        log.debug("Skipping room delivery to {} (session unavailable)", u);
                    }
                }
            } else {
                log.warn("Room {} not found for message from {}", room, userId);
            }
        } else {
            log.warn("Dropping message from {} without recipient", userId);
        }
    }

    private void handleLeave(WebSocketSession session, JsonNode node) {
        String userId = (String) session.getAttributes().getOrDefault("userId", "");
        JsonNode roomsNode = node.get("rooms");
        List<String> leftRooms = new ArrayList<>();
        if (roomsNode != null && roomsNode.isArray()) {
            for (JsonNode r : roomsNode) {
                if (!r.isTextual()) continue;
                Set<String> s = rooms.get(r.asText());
                if (s != null) {
                    s.remove(userId);
                    leftRooms.add(r.asText());
                }
            }
        }
        if (!leftRooms.isEmpty()) {
            log.info("User {} left rooms {} (sessionId={})", userId, leftRooms, session.getId());
        } else {
            log.debug("User {} sent leave without valid rooms (sessionId={})", userId, session.getId());
        }
    }

    private JsonNode parse(String json) {
        try {
            return mapper.readTree(json);
        } catch (Exception ex) {
            log.warn("Failed to parse incoming payload: {}", ex.getMessage());
            log.debug("Payload parsing failure", ex);
            return null;
        }
    }
}
