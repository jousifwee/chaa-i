package com.chaai.server;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ChatWebSocketHandlerTest {

    private ChatWebSocketHandler handler;

    @BeforeEach
    void setUp() {
        handler = new ChatWebSocketHandler();
    }

    @Test
    void shouldRouteDirectMessageToRecipient() throws Exception {
        WebSocketSession alice = mockSessionWithUser("alice");
        WebSocketSession bob = mockSessionWithUser("bob");

        // join alice
        handler.handleTextMessage(alice, new TextMessage("{" +
                "\"type\":\"join\",\"userId\":\"alice\"}"));
        // join bob
        handler.handleTextMessage(bob, new TextMessage("{" +
                "\"type\":\"join\",\"userId\":\"bob\"}"));

        // alice -> bob direct message
        String payload = "{\"type\":\"msg\",\"from\":\"alice\",\"to\":\"bob\",\"ciphertext\":\"xxx\"}";
        handler.handleTextMessage(alice, new TextMessage(payload));

        ArgumentCaptor<TextMessage> captor = ArgumentCaptor.forClass(TextMessage.class);
        verify(bob, times(1)).sendMessage(captor.capture());
        String sent = captor.getValue().getPayload();
        assertTrue(sent.contains("\"to\":\"bob\""));
    }

    @Test
    void shouldBroadcastToRoomMembersExceptSender() throws Exception {
        WebSocketSession alice = mockSessionWithUser("alice");
        WebSocketSession bob = mockSessionWithUser("bob");

        // join with room r1
        handler.handleTextMessage(alice, new TextMessage("{" +
                "\"type\":\"join\",\"userId\":\"alice\",\"rooms\":[\"r1\"]}"));
        handler.handleTextMessage(bob, new TextMessage("{" +
                "\"type\":\"join\",\"userId\":\"bob\",\"rooms\":[\"r1\"]}"));

        // alice -> room r1
        String payload = "{\"type\":\"msg\",\"from\":\"alice\",\"room\":\"r1\",\"ciphertext\":\"xxx\"}";
        handler.handleTextMessage(alice, new TextMessage(payload));

        verify(bob, times(1)).sendMessage(any(TextMessage.class));
        verify(alice, never()).sendMessage(any());
    }

    private WebSocketSession mockSessionWithUser(String userId) {
        WebSocketSession session = mock(WebSocketSession.class);
        Map<String, Object> attrs = new ConcurrentHashMap<>();
        attrs.put("userId", userId);
        when(session.getAttributes()).thenReturn(attrs);
        when(session.isOpen()).thenReturn(true);
        return session;
    }
}

