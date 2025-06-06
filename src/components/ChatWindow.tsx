import {
  Container,
  Stack,
  Group,
  ActionIcon,
  TextInput,
  Button,
  Menu,
  Text,
  Paper,
  Box,
  ScrollArea,
} from "@mantine/core";
import { MdSend, MdClose, MdEmojiEmotions, MdGif } from "react-icons/md";
import { useCallback, useEffect, useRef, useState, memo } from "react";
import ImageViewer from "./ImageViewer";
import { GifPicker } from "./GifPicker";
import type { ChatWindowProps, DisplayMessage } from "../types";
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
    timestamp,
    children,
  }: {
    isNotification: boolean;
    isOwnMessage: boolean;
    sender?: string;
    timestamp?: string;
    children: React.ReactNode;
  }) => {
    const formatTimestamp = (timestamp: string) => {
      const date = new Date(timestamp);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();

      const timeStr = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      if (isToday) {
        return timeStr;
      }

      const dateStr = date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });

      return `${dateStr} ${timeStr}`;
    };

    const formattedTime = timestamp ? formatTimestamp(timestamp) : "";

    return (
      <Group
        justify={
          isNotification ? "center" : isOwnMessage ? "flex-end" : "flex-start"
        }
        mb="xs"
        style={{ width: "100%" }}
      >
        <Paper
          p="xs"
          radius="md"
          bg={
            isNotification
              ? "var(--mantine-color-dark-5)"
              : isOwnMessage
              ? "var(--mantine-color-blue-8)"
              : "var(--mantine-color-dark-6)"
          }
          style={{
            maxWidth: "70%",
            position: "relative",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {!isNotification && !isOwnMessage && sender && (
            <Text
              size="xs"
              c="blue.4"
              mb={4}
              fw={500}
              style={{ textTransform: "capitalize" }}
            >
              {sender}
            </Text>
          )}
          <Box
            c={isOwnMessage ? "white" : "gray.0"}
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {children}
          </Box>
          {!isNotification && timestamp && (
            <Text
              size="xs"
              c={isOwnMessage ? "gray.3" : "gray.4"}
              ta={isOwnMessage ? "right" : "left"}
              mt={4}
              fw={100}
            >
              {formattedTime}
            </Text>
          )}
        </Paper>
      </Group>
    );
  }
);

interface Reaction {
  username: string;
  reaction: string;
  timestamp: string;
}

// Common wrapper for message content with hover state
const MessageContentWrapper = memo(
  ({
    children,
    isNotification,
    isOwnMessage,
    messageId,
    username,
    onReaction,
    userReactions,
    reactions,
    topOffset = -13,
  }: {
    children: React.ReactNode;
    isNotification: boolean;
    isOwnMessage: boolean;
    messageId: number | undefined;
    username: string;
    onReaction: (messageId: number | undefined, reaction: string) => void;
    userReactions: string[];
    reactions?: Reaction[];
    topOffset?: number;
  }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <Stack
        gap="xs"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {!isNotification && (
          <Box
            style={{
              position: "absolute",
              top: topOffset,
              [isOwnMessage ? "left" : "right"]: 4,
              opacity: isHovered ? 1 : 0,
              transition: "opacity 0.2s",
            }}
          >
            <ReactionButton
              isOwnMessage={isOwnMessage}
              onReaction={onReaction}
              messageId={messageId}
              userReactions={userReactions}
            />
          </Box>
        )}
        {children}
        {reactions && reactions.length > 0 && (
          <MessageReactions reactions={reactions} currentUsername={username} />
        )}
      </Stack>
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
    const userReactions =
      message.reactions
        ?.filter((reaction) => reaction.username === username)
        .map((reaction) => reaction.reaction) || [];

    if (message.type === "image" && message.imageData) {
      return (
        <MessageContentWrapper
          isNotification={isNotification}
          isOwnMessage={isOwnMessage}
          messageId={message.id}
          username={username}
          onReaction={onReaction}
          userReactions={userReactions}
          reactions={message.reactions}
          topOffset={4}
        >
          <Box
            style={{ cursor: "pointer" }}
            onClick={() => onImageClick(message.imageData!, message.imageType!)}
          >
            <img
              src={message.imageData}
              alt="Shared image"
              style={{
                maxWidth: "100%",
                maxHeight: "300px",
                width: "auto",
                height: "auto",
                borderRadius: "4px",
                objectFit: "contain",
                display: "block",
                margin: "0 auto",
                ...(message.imageType === "image/gif" && {
                  imageRendering: "pixelated",
                  willChange: "transform",
                }),
              }}
            />
          </Box>
        </MessageContentWrapper>
      );
    }

    return (
      <MessageContentWrapper
        isNotification={isNotification}
        isOwnMessage={isOwnMessage}
        messageId={message.id}
        username={username}
        onReaction={onReaction}
        userReactions={userReactions}
        reactions={message.reactions}
      >
        <Box>
          {isNotification ? (
            <Text size="sm" component="span">
              {message.content}
            </Text>
          ) : (
            <Box component="span">
              {makeLinksClickable(message.content || "")}
            </Box>
          )}
        </Box>
      </MessageContentWrapper>
    );
  }
);

// Memoize the message list rendering
const MessageList = memo(
  ({
    messages,
    username,
    onReaction,
    onImageClick,
  }: {
    messages: DisplayMessage[];
    username: string;
    onReaction: (messageId: number | undefined, reaction: string) => void;
    onImageClick: (imageData: string, imageType: string) => void;
  }) => {
    return (
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
              timestamp={message.timestamp}
            >
              <MessageContent
                message={message}
                isNotification={isNotification}
                isOwnMessage={isOwnMessage}
                username={username}
                onReaction={onReaction}
                onImageClick={onImageClick}
              />
            </MessageContainer>
          );
        })}
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
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    type: string;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [gifPickerOpened, setGifPickerOpened] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const initialLoadDoneRef = useRef<boolean>(false);
  const oldScrollHeightRef = useRef<number>(0);
  const oldScrollTopRef = useRef<number>(0);
  const pendingScrollAdjustmentRef = useRef<boolean>(false);
  const prevMessagesLengthRef = useRef<number>(0);

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

  // Memoize the scroll handler
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;

    const { scrollTop } = chatContainerRef.current;
    if (scrollTop === 0 && hasMoreHistory && !isLoadingMore) {
      oldScrollHeightRef.current = chatContainerRef.current.scrollHeight;
      oldScrollTopRef.current = chatContainerRef.current.scrollTop;
      pendingScrollAdjustmentRef.current = true;
      setIsLoadingMore(true);
      loadMoreHistory();
    }
  }, [hasMoreHistory, loadMoreHistory, isLoadingMore]);

  // Memoize the send message handler
  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputMessage.trim() && !selectedFile) return;

      if (selectedFile) {
        if (
          selectedFile.size === 0 &&
          selectedFile.type === "image/gif" &&
          previewUrl
        ) {
          // Handle GIF URL directly
          sendMessage("", {
            type: "image",
            imageData: previewUrl,
            imageType: "image/gif",
          });
        } else {
          // Handle regular images with base64 conversion
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64Data = e.target?.result as string;
            const imageType = selectedFile.type;
            sendMessage("", {
              type: "image",
              imageData: base64Data,
              imageType,
            });
          };
          reader.readAsDataURL(selectedFile);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        sendMessage(inputMessage);
        setInputMessage("");
      }
    },
    [inputMessage, selectedFile, previewUrl, sendMessage]
  );

  // Memoize the image click handler
  const handleImageClick = useCallback(
    (imageData: string, imageType: string) => {
      setSelectedImage({ url: imageData, type: imageType });
    },
    []
  );

  // Memoize the reaction handler
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

  // Memoize the paste handler
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

  // Memoize the input change handler
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputMessage(e.target.value);
    },
    []
  );

  // Memoize the remove preview handler
  const handleRemovePreview = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  // Cleanup function for preview URLs
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleGifSelect = useCallback((gifUrl: string) => {
    setSelectedFile(new File([], "gif.gif", { type: "image/gif" }));
    setPreviewUrl(gifUrl);
  }, []);

  return (
    <Container
      size="sm"
      h="100%"
      styles={{
        root: {
          padding: "0",
          "@media (minWidth: 768px)": {
            padding: "1rem",
          },
        },
      }}
    >
      <Stack
        h="100%"
        gap="md"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(2px)",
          borderRadius: "8px",
          padding: "1rem",
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <ScrollArea
          viewportRef={chatContainerRef}
          onScrollPositionChange={handleScroll}
          h="calc(100vh - 200px)"
          styles={{
            viewport: {
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
              touchAction: "pan-y",
            },
            root: {
              position: "relative",
              isolation: "isolate",
            },
          }}
        >
          <MessageList
            messages={messages}
            username={username}
            onReaction={handleReaction}
            onImageClick={handleImageClick}
          />
        </ScrollArea>

        <form
          onSubmit={handleSendMessage}
          style={{
            paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <Group>
            <TextInput
              value={inputMessage}
              onChange={handleInputChange}
              onPaste={handlePaste}
              placeholder="Type a message..."
              style={{ flex: 1 }}
              autoComplete="off"
            />
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() => setGifPickerOpened(true)}
              title="Add GIF"
            >
              <MdGif size={20} />
            </ActionIcon>
            <Button type="submit" variant="filled" color="blue">
              <MdSend size={20} />
            </Button>
          </Group>
        </form>

        {previewUrl && (
          <Box>
            <Stack gap="xs" align="center">
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "200px",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                }}
              />
              <Button
                variant="subtle"
                color="red"
                size="xs"
                leftSection={<MdClose size={16} />}
                onClick={handleRemovePreview}
              >
                Remove {selectedFile?.type === "image/gif" ? "GIF" : "image"}
              </Button>
            </Stack>
          </Box>
        )}

        {selectedImage && (
          <ImageViewer
            imageUrl={selectedImage.url}
            onClose={() => setSelectedImage(null)}
          />
        )}

        <GifPicker
          opened={gifPickerOpened}
          onClose={() => setGifPickerOpened(false)}
          onSelect={handleGifSelect}
        />
      </Stack>
    </Container>
  );
}

export default memo(ChatWindow);
