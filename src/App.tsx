// src/App.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import ChatSetup from "./components/ChatSetup.tsx";
import ChatWindow from "./components/ChatWindow.tsx";
import UserList from "./components/UserList.tsx";
import type { WebSocketMessage, DisplayMessage } from "./types.ts";

function App() {
  const [username, setUsername] = useState<string>("");
  const [roomName, setRoomName] = useState<string>("");
  const [, setAuthToken] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const ws = useRef<WebSocket | null>(null);

  const connectWebSocket = useCallback(
    (user: string, room: string, token: string) => {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const wsURL = `${protocol}://${
        window.location.host
      }/ws?username=${encodeURIComponent(user)}&room=${encodeURIComponent(
        room
      )}`;

      ws.current = new WebSocket(wsURL, [token]);
      setUsername(user);
      setRoomName(room);
      setAuthToken(token);

      ws.current.onopen = () => {
        console.log("WebSocket Connected");
        setIsConnected(true);
        // Clear previous messages before connecting to a new room
        setMessages([]);
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("Received:", message);

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
            // --- NEW: Handle historical messages batch ---
            case "history_batch":
              if (message.history && Array.isArray(message.history)) {
                const historyDisplayMessages: DisplayMessage[] =
                  message.history.map((histMsg) => ({
                    type: "chat", // Display historical items as regular chat messages
                    sender: histMsg.username,
                    content: histMsg.content!,
                    timestamp: histMsg.timestamp, // Use the timestamp from the historical item
                  }));
                // Prepend or append based on desired display order
                // If you want history to appear first, before any "join" notifications
                setMessages((prev) => [...historyDisplayMessages, ...prev]);

                // Or if you want history to appear after a "connecting..." message, then append
                // setMessages((prev) => [...prev, ...historyDisplayMessages]);

                console.log(
                  `Displayed ${historyDisplayMessages.length} historical messages.`
                );
              }
              break;
            // --- END NEW ---
            case "user_list":
              if (message.userList) {
                setUsers(message.userList);
              }
              break;
            case "notification":
              if (message.content) {
                setMessages((prev) => [
                  ...prev,
                  { type: "notification", content: message.content! },
                ]);
              }
              break;
            case "error": {
              let errorMessage = `Error: ${
                message.content || "An unknown error occurred."
              }`;
              if (message.content) {
                errorMessage = `Error: ${message.content}`;
              } else if (message.room) {
                errorMessage = `Error in room ${message.room}: ${
                  message.content || "An unknown error occurred."
                }`;
              }
              alert(errorMessage);

              if (
                message.content &&
                (message.content.includes("Authentication failed") ||
                  message.content.includes("Username already exists") || // Updated error message check
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
                    content: `${message.username} ${
                      message.type === "join" ? "joined" : "left"
                    } room "${message.room}".`,
                  },
                ]);
                if (message.userList) {
                  setUsers(message.userList);
                }
              }
              break;
            default:
              console.warn(
                "Unknown message type received:",
                message.type,
                message
              );
          }
        } catch (error) {
          console.error(
            "Failed to parse WebSocket message:",
            error,
            event.data
          );
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket Disconnected");
        setIsConnected(false);
        setMessages((prev) => [
          ...prev,
          { type: "notification", content: "Disconnected from chat." },
        ]);
        setUsers([]);
        setRoomName("");
        setUsername("");
        setAuthToken("");
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket Error:", error);
      };
    },
    []
  );

  const sendMessage = (content: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const chatMessageToSend: WebSocketMessage = {
        type: "chat",
        username: username,
        content: content,
        room: roomName,
      };
      ws.current.send(JSON.stringify(chatMessageToSend));
    } else {
      console.warn("WebSocket not open. Cannot send message.");
      alert("You are not connected. Please join the chat again.");
    }
  };

  const handleDisconnect = () => {
    if (ws.current) {
      ws.current.close();
    }
    setUsername("");
    setRoomName("");
    setAuthToken("");
    setIsConnected(false);
    setMessages([]);
    setUsers([]);
  };

  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return (
    <div
      className="flex flex-col h-screen bg-cover bg-center"
      style={{ backgroundImage: `url('galaxyBg.webp')` }}
    >
      {
        <main className="flex flex-1 p-4 overflow-hidden ">
          {!isConnected ? (
            <ChatSetup onConnect={connectWebSocket} />
          ) : (
            <div className="flex w-full h-full space-x-4">
              <ChatWindow
                messages={messages}
                sendMessage={sendMessage}
                username={username}
                roomName={roomName}
                onDisconnect={handleDisconnect}
              />
              <div
                className="w-1/4 flex-shrink-0 bg-white rounded-lg shadow p-4"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
              >
                <UserList
                  users={users}
                  currentUser={username}
                  roomName={roomName}
                />
              </div>
            </div>
          )}
        </main>
      }
    </div>
  );
}

export default App;
