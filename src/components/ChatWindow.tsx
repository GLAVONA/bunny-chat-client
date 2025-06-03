import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  Paper,
  Text,
  Stack,
  Group,
  ActionIcon,
  TextInput,
  Button,
  Menu,
  Container,
  ScrollArea,
  Box,
} from "@mantine/core";
import { MdSend, MdEmojiEmotions, MdImage } from "react-icons/md";
import type { ChatWindowProps, DisplayMessage } from "../types";
import ImageViewer from "./ImageViewer";
import { MessageReactions } from "./MessageReactions";

// Helper function to detect URLs and make them clickable
const makeLinksClickable = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <Text
          key={index}
          component="a"
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          c="blue"
          style={{ textDecoration: "underline" }}
        >
          {part}
        </Text>
      );
    }
    return part;
  });
};

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "👏", "🎉", "🔥"];

// Reaction Button Component
const ReactionButton = memo(
  ({
    isOwnMessage,
    onReaction,
    messageId,
    userReactions,
  }: {
    isOwnMessage: boolean;
    onReaction: (messageId: number | undefined, reaction: string) => void;
    messageId: number | undefined;
    userReactions: string[];
  }) => {
    return (
      <Menu position={isOwnMessage ? "left" : "right"}>
        <Menu.Target>
          <ActionIcon variant="subtle" color="gray">
            <MdEmojiEmotions size={18} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Group gap="xs">
            {REACTIONS.map((reaction) => {
              const userHasReacted = userReactions.includes(reaction);
              return (
                <ActionIcon
                  key={reaction}
                  variant={userHasReacted ? "filled" : "subtle"}
                  color={userHasReacted ? "blue" : "gray"}
                  onClick={() => onReaction(messageId, reaction)}
                >
                  {reaction}
                </ActionIcon>
              );
            })}
          </Group>
        </Menu.Dropdown>
      </Menu>
    );
  }
);

// Message Container Component
const MessageContainer = memo(
  ({
    isNotification,
    isOwnMessage,
    sender,
    username,
    children,
  }: {
    isNotification: boolean;
    isOwnMessage: boolean;
    sender?: string;
    username: string;
    children: React.ReactNode;
  }) => {
    return (
      <Group
        justify={
          isNotification ? "center" : isOwnMessage ? "flex-end" : "flex-start"
        }
        mb="xs"
      >
        <Paper
          p="xs"
          radius="md"
          bg={
            isNotification
              ? "var(--mantine-color-dark-6)"
              : isOwnMessage
              ? "var(--mantine-color-blue-9)"
              : "var(--mantine-color-dark-7)"
          }
          style={{ maxWidth: "70%" }}
        >
          {!isNotification && sender && sender !== username && (
            <Text size="xs" c="dimmed" mb={4}>
              {sender}
            </Text>
          )}
          {children}
        </Paper>
      </Group>
    );
  }
);

// Message Content Component
const MessageContent = memo(
  ({
    message,
    isNotification,
    isOwnMessage,
    username,
    onReaction,
    onImageClick,
  }: {
    message: DisplayMessage;
    isNotification: boolean;
    isOwnMessage: boolean;
    username: string;
    onReaction: (messageId: number | undefined, reaction: string) => void;
    onImageClick: (imageData: string, imageType: string) => void;
  }) => {
    // Calculate userReactions specifically for this message
    const userReactions =
      message.reactions
        ?.filter((reaction) => reaction.username === username)
        .map((reaction) => reaction.reaction) || [];

    if (message.type === "image" && message.imageData) {
      return (
        <Stack gap="xs">
          <Box
            style={{ cursor: "pointer" }}
            onClick={() => onImageClick(message.imageData!, message.imageType!)}
          >
            <img
              src={message.imageData}
              alt="Shared image"
              style={{ maxWidth: "100%", borderRadius: "4px" }}
            />
          </Box>
          {message.reactions && message.reactions.length > 0 && (
            <MessageReactions
              reactions={message.reactions}
              currentUsername={username}
            />
          )}
          <ReactionButton
            isOwnMessage={isOwnMessage}
            onReaction={onReaction}
            messageId={message.id}
            userReactions={userReactions}
          />
        </Stack>
      );
    }

    return (
      <Stack gap="xs">
        <Text size="sm">
          {isNotification
            ? message.content
            : makeLinksClickable(message.content || "")}
        </Text>
        {message.reactions && message.reactions.length > 0 && (
          <MessageReactions
            reactions={message.reactions}
            currentUsername={username}
          />
        )}
        {!isNotification && (
          <ReactionButton
            isOwnMessage={isOwnMessage}
            onReaction={onReaction}
            messageId={message.id}
            userReactions={userReactions}
          />
        )}
      </Stack>
    );
  }
);

// Main ChatWindow Component
function ChatWindow({
  messages,
  sendMessage,
  loadMoreHistory,
  hasMoreHistory,
  username,
}: ChatWindowProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    type: string;
  } | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const initialLoadDoneRef = useRef<boolean>(false);
  const oldScrollHeightRef = useRef<number>(0);
  const oldScrollTopRef = useRef<number>(0);
  const pendingScrollAdjustmentRef = useRef<boolean>(false);
  const prevMessagesLengthRef = useRef<number>(0);
  const observerRef = useRef<MutationObserver | null>(null);

  // Set up MutationObserver to handle scroll position adjustments
  useEffect(() => {
    if (!chatContainerRef.current) return;

    observerRef.current = new MutationObserver(() => {
      if (pendingScrollAdjustmentRef.current && chatContainerRef.current) {
        const chatContainer = chatContainerRef.current;
        const newScrollHeight = chatContainer.scrollHeight;
        const scrollDiff = newScrollHeight - oldScrollHeightRef.current;

        // Apply scroll adjustment immediately when DOM changes
        chatContainer.scrollTop = oldScrollTopRef.current + scrollDiff;
        pendingScrollAdjustmentRef.current = false;
        setIsLoadingMore(false);
      }
    });

    observerRef.current.observe(chatContainerRef.current, {
      childList: true,
      subtree: true,
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Scroll to bottom on initial load and when new messages arrive
  useEffect(() => {
    if (!initialLoadDoneRef.current && messages.length > 0) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
          initialLoadDoneRef.current = true;
        }
      });
    } else if (
      messages.length > prevMessagesLengthRef.current &&
      !pendingScrollAdjustmentRef.current &&
      !isLoadingMore
    ) {
      // Only scroll to bottom for new messages, not when loading history
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isLoadingMore]);

  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop } = chatContainerRef.current;
      if (scrollTop === 0 && hasMoreHistory && !isLoadingMore) {
        // Save current scroll position and height before loading more
        oldScrollHeightRef.current = chatContainerRef.current.scrollHeight;
        oldScrollTopRef.current = chatContainerRef.current.scrollTop;
        pendingScrollAdjustmentRef.current = true;
        setIsLoadingMore(true);
        loadMoreHistory();
      }
    }
  }, [hasMoreHistory, loadMoreHistory, isLoadingMore]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputMessage.trim() && !selectedFile) return;

      if (selectedFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Data = e.target?.result as string;
          const imageType = selectedFile.type;
          sendMessage("", {
            type: "image",
            imageData: base64Data,
            imageType,
          });
          setSelectedFile(null);
          setPreviewUrl(null);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        sendMessage(inputMessage);
        setInputMessage("");
      }
    },
    [inputMessage, selectedFile, sendMessage]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    },
    []
  );

  const handleImageClick = useCallback(
    (imageData: string, imageType: string) => {
      setSelectedImage({ url: imageData, type: imageType });
    },
    []
  );

  const handleReaction = useCallback(
    (messageId: number | undefined, reaction: string) => {
      if (messageId !== undefined) {
        sendMessage("", {
          type: "reaction",
          reactionToId: messageId,
          reaction,
        });
      }
    },
    [sendMessage]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setSelectedFile(file);
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        }
        break;
      }
    }
  }, []);

  return (
    <Container size="lg" h="100%">
      <Stack h="100%" gap="md">
        <ScrollArea
          viewportRef={chatContainerRef}
          onScrollPositionChange={handleScroll}
          h="calc(100vh - 200px)"
        >
          <Stack gap="xs" p="md">
            {messages.map((message, index) => {
              const isOwnMessage = message.sender === username;
              const isNotification = message.type === "notification";
              return (
                <MessageContainer
                  key={message.id || index}
                  isNotification={isNotification}
                  isOwnMessage={isOwnMessage}
                  sender={message.sender}
                  username={username}
                >
                  <MessageContent
                    message={message}
                    isNotification={isNotification}
                    isOwnMessage={isOwnMessage}
                    username={username}
                    onReaction={handleReaction}
                    onImageClick={handleImageClick}
                  />
                </MessageContainer>
              );
            })}
            <div ref={messagesEndRef} />
          </Stack>
        </ScrollArea>

        <Paper p="md" radius="md" withBorder>
          <form onSubmit={handleSendMessage}>
            <Stack>
              {previewUrl && (
                <Box>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ maxHeight: "200px", borderRadius: "4px" }}
                  />
                  <Button
                    variant="subtle"
                    color="red"
                    size="xs"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    Remove
                  </Button>
                </Box>
              )}
              <Group>
                <TextInput
                  placeholder="Type a message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onPaste={handlePaste}
                  style={{ flex: 1 }}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={handleFileSelect}
                />
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <MdImage size={20} />
                </ActionIcon>
                <Button
                  type="submit"
                  variant="filled"
                  color="blue"
                  disabled={!inputMessage.trim() && !selectedFile}
                >
                  <MdSend size={20} />
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Stack>

      {selectedImage && (
        <ImageViewer
          imageUrl={selectedImage.url}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </Container>
  );
}

export default ChatWindow;
