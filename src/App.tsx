// src/App.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { AppShell, Container, Burger, Group, Button } from "@mantine/core";
import ChatSetup from "./components/ChatSetup.tsx";
import ChatWindow from "./components/ChatWindow.tsx";
import UserList from "./components/UserList.tsx";
import type { WebSocketMessage, DisplayMessage } from "./types.ts";
import { AuthService } from "./services/auth.ts";
import { WebSocketService } from "./services/websocket.ts";
import { theme } from "./theme";
import { useTitleNotification } from "./hooks/useTitleNotification";

function App() {
  const [username, setUsername] = useState<string>("");
  const usernameRef = useRef(username);
  const [roomName, setRoomName] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [hasMoreHistory, setHasMoreHistory] = useState<boolean>(false);
  const [pageToken, setPageToken] = useState<string>("");
  const ws = useRef<WebSocketService | null>(null);
  const cleanupRef = useRef<(() => void)[]>([]);
  const messageHandlerRef = useRef<
    ((message: WebSocketMessage) => void) | null
  >(null);
  const [opened, setOpened] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  useTitleNotification(hasNewMessage);

  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  useEffect(() => {
    const handleFocus = () => {
      console.log("Window focused, resetting hasNewMessage");
      setHasNewMessage(false);
    };

    const handleBlur = () => {
      console.log("Window blurred");
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    messageHandlerRef.current = (message: WebSocketMessage) => {
      switch (message.type) {
        case "chat":
          if (message.username && message.content) {
            console.log("Received chat message from server:", message);
            setMessages((prev) => {
              const existingMessage = prev.find((msg) => msg.id === message.id);
              if (existingMessage) {
                console.log("Message already exists with this ID, skipping");
                return prev;
              }

              const newMessage: DisplayMessage = {
                id: message.id!,
                type: "chat",
                sender: message.username,
                content: message.content,
                timestamp: message.timestamp!,
              };
              const newMessages = [...prev, newMessage];
              console.log("Added new message:", newMessage);
              if (message.username !== usernameRef.current) {
                console.log(
                  "Setting hasNewMessage to true for new message from:",
                  message.username
                );
                setHasNewMessage(true);
              }
              return newMessages;
            });
          }
          break;
        case "image":
          if (message.username && message.imageData) {
            setMessages((prev) => {
              const isOwnMessage = message.username === usernameRef.current;
              if (isOwnMessage) {
                const index = prev.findIndex(
                  (msg) =>
                    msg.type === "image" &&
                    msg.imageData === message.imageData &&
                    msg.sender === username
                );
                if (index !== -1) {
                  const newMessages = [...prev];
                  newMessages[index] = {
                    ...newMessages[index],
                    id: message.id,
                  };
                  return newMessages;
                }
              }
              if (!isOwnMessage) {
                console.log(
                  "Setting hasNewMessage to true for new image from:",
                  message.username
                );
                setHasNewMessage(true);
              }
              return [
                ...prev,
                {
                  id: message.id,
                  type: "image",
                  sender: message.username,
                  imageData: message.imageData,
                  imageType: message.imageType,
                  timestamp: message.timestamp,
                },
              ];
            });
          }
          break;
        case "reaction":
          if (message.reactionToId !== undefined) {
            setMessages((prev) => {
              const newMessages = [...prev];
              const reactionToId = message.reactionToId;
              if (typeof reactionToId !== "number") return newMessages;

              const targetMessage = newMessages.find(
                (msg) => msg.id === reactionToId
              );
              if (targetMessage) {
                const validReactions =
                  message.history?.filter(
                    (reaction) =>
                      reaction.type === "reaction" &&
                      reaction.username &&
                      reaction.reaction &&
                      reaction.timestamp
                  ) || [];

                // Remove any existing reaction from the same user for this message
                const filteredReactions = validReactions.filter(
                  (reaction) =>
                    !(
                      reaction.username === message.username &&
                      reaction.reaction === message.reaction
                    )
                );

                // If the reaction was removed, update the reactions
                if (filteredReactions.length < validReactions.length) {
                  targetMessage.reactions = filteredReactions.map(
                    (reaction) => ({
                      username: reaction.username!,
                      reaction: reaction.reaction!,
                      timestamp: reaction.timestamp,
                    })
                  );
                } else {
                  // Otherwise add the new reaction
                  targetMessage.reactions = validReactions.map((reaction) => ({
                    username: reaction.username!,
                    reaction: reaction.reaction!,
                    timestamp: reaction.timestamp,
                  }));
                }
              }
              return newMessages;
            });
          }
          break;
        case "history_batch":
          if (message.history && Array.isArray(message.history)) {
            const historyDisplayMessages: DisplayMessage[] =
              message.history.map((histMsg) => ({
                id: histMsg.id,
                type: histMsg.type === "image" ? "image" : "chat",
                sender: histMsg.username,
                content: histMsg.content,
                timestamp: histMsg.timestamp,
                imageData: histMsg.imageData,
                imageType: histMsg.imageType,
                reactions: (histMsg as WebSocketMessage).history
                  ?.filter(
                    (reaction) =>
                      reaction.type === "reaction" &&
                      reaction.username &&
                      reaction.reaction &&
                      reaction.timestamp
                  )
                  .map((reaction) => ({
                    username: reaction.username,
                    reaction: reaction.reaction!,
                    timestamp: reaction.timestamp,
                  })),
              }));
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
    };
  }, [username]);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (messageHandlerRef.current) {
      messageHandlerRef.current(message);
    }
  }, []);

  const loadMoreHistory = useCallback(() => {
    if (!ws.current || !hasMoreHistory || !pageToken) return;

    const loadMoreMessage: WebSocketMessage = {
      type: "load_more_history",
      room: roomName,
      pageToken: pageToken,
      pageSize: 50,
      username: username,
    };

    ws.current.sendMessage(loadMoreMessage);
  }, [hasMoreHistory, pageToken, roomName, username]);

  const connectWebSocket = useCallback(
    async (user: string, room: string, token?: string) => {
      try {
        if (token) {
          const authResponse = await AuthService.authenticate(
            user,
            token,
            room
          );
          if (!authResponse.success) {
            throw new Error(authResponse.message || "Authentication failed");
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const session = await AuthService.checkSession();
        if (!session.valid) {
          throw new Error("No valid session found");
        }

        ws.current = new WebSocketService(user, room, token ?? "");

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

    return () => {
      mounted = false;
      cleanupRef.current.forEach((cleanup) => cleanup());
      if (ws.current && !ws.current.isConnecting) {
        ws.current.disconnect();
        ws.current = null;
      }
    };
  }, [connectWebSocket]);

  const sendMessage = useCallback(
    (
      content: string,
      imageData?:
        | { type: "image"; imageData: string; imageType: string }
        | { type: "reaction"; reactionToId: number; reaction: string }
    ) => {
      if (!ws.current) return;

      if (imageData?.type === "reaction") {
        const targetMessage = messages.find(
          (msg) => msg.id === imageData.reactionToId
        );
        if (!targetMessage) {
          console.error("Cannot react to message: Message not found");
          return;
        }
      }

      let message: WebSocketMessage = {
        type: "chat",
        username: username,
        room: roomName,
        content: content,
      };

      if (imageData) {
        if (imageData.type === "reaction") {
          message = {
            ...message,
            type: "reaction",
            reactionToId: imageData.reactionToId,
            reaction: imageData.reaction,
          };
        } else if (imageData.type === "image") {
          message = {
            ...message,
            type: "image",
            imageData: imageData.imageData,
            imageType: imageData.imageType,
          };
        }
      }

      ws.current.sendMessage(message);
    },
    [username, roomName, messages]
  );

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
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications />
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundImage: "url(/galaxyBg.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: -1,
          overflow: "hidden",
        }}
      />
      <div style={{ height: "100vh", overflow: "hidden" }}>
        <AppShell
          header={{ height: 60 }}
          navbar={{
            width: 200,
            breakpoint: "sm",
            collapsed: { mobile: !opened },
          }}
          styles={{
            root: {
              overflow: "hidden",
              height: "100%",
            },
            main: {
              backgroundColor: "transparent",
              overflow: "hidden",
              height: "100%",
            },
            navbar: {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              overflow: "hidden",
            },
            header: {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
            },
          }}
        >
          <AppShell.Header>
            <Container
              h="100%"
              display="flex"
              style={{ alignItems: "center", justifyContent: "flex-end" }}
            >
              {isConnected && (
                <Group gap="xs">
                  <Button
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={handleDisconnect}
                  >
                    Leave Room
                  </Button>
                  <Burger
                    opened={opened}
                    onClick={() => setOpened(!opened)}
                    hiddenFrom="sm"
                    size="sm"
                  />
                </Group>
              )}
            </Container>
          </AppShell.Header>

          <AppShell.Navbar p="md">
            {isConnected && (
              <UserList
                users={users}
                currentUser={username}
                roomName={roomName}
              />
            )}
          </AppShell.Navbar>

          <AppShell.Main>
            {!isConnected ? (
              <ChatSetup onConnect={connectWebSocket} />
            ) : (
              <ChatWindow
                messages={messages}
                sendMessage={sendMessage}
                loadMoreHistory={loadMoreHistory}
                hasMoreHistory={hasMoreHistory}
                username={username}
                roomName={roomName}
                onDisconnect={handleDisconnect}
              />
            )}
          </AppShell.Main>
        </AppShell>
      </div>
    </MantineProvider>
  );
}

export default App;
