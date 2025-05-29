// src/App.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import ChatSetup from "./components/ChatSetup.tsx";
import ChatWindow from "./components/ChatWindow.tsx";
import UserList from "./components/UserList.tsx";
import type { WebSocketMessage, DisplayMessage } from "./types.ts";
import { AuthService } from "./services/auth.ts";
import { WebSocketService } from "./services/websocket.ts";

function App() {
  const [username, setUsername] = useState<string>("");
  const [roomName, setRoomName] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [hasMoreHistory, setHasMoreHistory] = useState<boolean>(false);
  const [pageToken, setPageToken] = useState<string>("");
  const ws = useRef<WebSocketService | null>(null);
  const cleanupRef = useRef<(() => void)[]>([]);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case "chat":
        if (message.username && message.content) {
          setMessages((prev) => [
            ...prev,
            {
              type: "chat",
              sender: message.username,
              content: message.content!,
              timestamp: message.timestamp,
            },
          ]);
        }
        break;
      case "history_batch":
        if (message.history && Array.isArray(message.history)) {
          const historyDisplayMessages: DisplayMessage[] = message.history.map(
            (histMsg) => ({
              type: "chat",
              sender: histMsg.username,
              content: histMsg.content!,
              timestamp: histMsg.timestamp,
            })
          );
          setMessages((prev) => [...historyDisplayMessages, ...prev]);
          setHasMoreHistory(message.hasMore || false);
          setPageToken(message.pageToken || "");
          console.log(
            `Displayed ${historyDisplayMessages.length} historical messages. Has more: ${message.hasMore}`
          );
        }
        break;
      case "user_list":
        if (message.userList) {
          setUsers(message.userList);
        }
        break;
      case "notification":
        if (message.content) {
          setMessages((prev) => [
            ...prev,
            {
              type: "notification",
              content: message.content!,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
        break;
      case "error": {
        const errorMessage = message.content || "An unknown error occurred.";
        alert(`Error: ${errorMessage}`);

        if (
          message.content &&
          (message.content.includes("Authentication failed") ||
            message.content.includes("Username already exists") ||
            message.content.includes("Invalid room name"))
        ) {
          handleDisconnect();
        }
        break;
      }
      case "join":
      case "leave":
        if (message.username && message.room) {
          setMessages((prev) => [
            ...prev,
            {
              type: "notification",
              content: `${message.username} has ${
                message.type === "join" ? "joined" : "left"
              } room "${message.room}".`,
              timestamp: new Date().toISOString(),
            },
          ]);
          if (message.userList) {
            setUsers(message.userList);
          }
        }
        break;
      default:
        console.warn("Unknown message type received:", message.type, message);
    }
  }, []);

  const loadMoreHistory = useCallback(() => {
    if (!ws.current || !hasMoreHistory || !pageToken) return;

    const loadMoreMessage: WebSocketMessage = {
      type: "load_more_history",
      room: roomName,
      pageToken: pageToken,
      pageSize: 50, // Use the same page size as server
    };

    ws.current.sendMessage(loadMoreMessage);
  }, [hasMoreHistory, pageToken, roomName]);

  const connectWebSocket = useCallback(
    async (user: string, room: string, token?: string) => {
      try {
        // If token is provided, authenticate first
        if (token) {
          const authResponse = await AuthService.authenticate(
            user,
            token,
            room
          );
          if (!authResponse.success) {
            throw new Error(authResponse.message || "Authentication failed");
          }
        }

        // Create new WebSocket connection
        ws.current = new WebSocketService(user, "", token ?? "");

        // Set up message handlers
        const cleanupMessage = ws.current.onMessage(handleWebSocketMessage);
        const cleanupOpen = ws.current.onOpen(() => {
          console.log("WebSocket Connected");
          setIsConnected(true);
          setMessages([]);
        });
        const cleanupClose = ws.current.onClose((event) => {
          console.log("WebSocket Disconnected", event);
          if (!event.wasClean) {
            console.warn("WebSocket closed unexpectedly");
          }
          setIsConnected(false);
          setMessages((prev) => [
            ...prev,
            {
              type: "notification",
              content: "Disconnected from chat.",
              timestamp: new Date().toISOString(),
            },
          ]);
          setUsers([]);
          setRoomName("");
          setUsername("");
        });
        const cleanupError = ws.current.onError((error) => {
          console.error("WebSocket Error:", error);
          setIsConnected(false);
        });

        // Store cleanup functions
        cleanupRef.current = [
          cleanupMessage,
          cleanupOpen,
          cleanupClose,
          cleanupError,
        ];

        setUsername(user);
        setRoomName(room);
      } catch (error) {
        console.error("Connection error:", error);
        alert(error instanceof Error ? error.message : "Failed to connect");
        handleDisconnect();
      }
    },
    [handleWebSocketMessage]
  );

  // Check for existing session on mount
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const session = await AuthService.checkSession();
        if (mounted && session.valid && session.username && session.room) {
          connectWebSocket(session.username, session.room);
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };

    checkSession();

    // Cleanup function
    return () => {
      mounted = false;
      cleanupRef.current.forEach((cleanup) => cleanup());
      if (ws.current) {
        ws.current.disconnect();
        ws.current = null;
      }
    };
  }, [connectWebSocket]);

  const sendMessage = (content: string) => {
    if (!ws.current) {
      console.warn("WebSocket not open. Cannot send message.");
      alert("You are not connected. Please join the chat again.");
      return;
    }

    try {
      const chatMessageToSend: WebSocketMessage = {
        type: "chat",
        username: username,
        content: content,
        room: roomName,
      };
      ws.current.sendMessage(chatMessageToSend);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleDisconnect = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      cleanupRef.current.forEach((cleanup) => cleanup());
      if (ws.current) {
        ws.current.disconnect();
        ws.current = null;
      }
      setUsername("");
      setRoomName("");
      setIsConnected(false);
      setMessages([]);
      setUsers([]);
    }
  };

  return (
    <div
      className="flex flex-col h-screen bg-cover bg-center"
      style={{ backgroundImage: `url('galaxyBg.webp')` }}
    >
      <main className="flex-1 flex justify-center px-4 md:px-8 lg:px-16 h-full">
        <div className="w-full max-w-7xl flex gap-4 h-full">
          {!isConnected ? (
            <ChatSetup onConnect={connectWebSocket} />
          ) : (
            <>
              <div className="flex-1 min-w-0 h-full">
                <ChatWindow
                  messages={messages}
                  sendMessage={sendMessage}
                  loadMoreHistory={loadMoreHistory}
                  hasMoreHistory={hasMoreHistory}
                  username={username}
                  roomName={roomName}
                  onDisconnect={handleDisconnect}
                />
              </div>
              <div className="w-52 flex-shrink-0 h-full">
                <UserList
                  users={users}
                  currentUser={username}
                  roomName={roomName}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
