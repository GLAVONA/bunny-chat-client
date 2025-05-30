import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import type { ChatWindowProps, DisplayMessage } from "../types";
import emojis from "../emojis";
import ImageViewer from "./ImageViewer";
import { MessageReactions } from "./MessageReactions";

// Helper function to detect URLs and make them clickable
const makeLinksClickable = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-300 hover:text-blue-400 underline"
        >
          {part}
        </a>
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
    const [showReactions, setShowReactions] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (showReactions && buttonRef.current && popupRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const popupRect = popupRef.current.getBoundingClientRect();
        const chatWindow = document.getElementById("chatMessages");
        const chatWindowRect = chatWindow?.getBoundingClientRect();

        if (!chatWindowRect) return;

        // Calculate if popup would go off-screen to the right
        const wouldOverflowRight =
          buttonRect.right + popupRect.width > chatWindowRect.right;
        const wouldOverflowLeft =
          buttonRect.left - popupRect.width < chatWindowRect.left;

        if (wouldOverflowRight) {
          popupRef.current.style.right = "0";
          popupRef.current.style.left = "auto";
        } else if (wouldOverflowLeft) {
          popupRef.current.style.left = "0";
          popupRef.current.style.right = "auto";
        } else {
          if (isOwnMessage) {
            popupRef.current.style.right = "0";
            popupRef.current.style.left = "auto";
          } else {
            popupRef.current.style.left = "0";
            popupRef.current.style.right = "auto";
          }
        }

        // Ensure popup stays within chat window's top boundary
        const wouldOverflowTop =
          buttonRect.top - popupRect.height < chatWindowRect.top;
        if (wouldOverflowTop) {
          popupRef.current.style.top = "100%";
          popupRef.current.style.bottom = "auto";
          popupRef.current.style.marginTop = "0.5rem";
          popupRef.current.style.marginBottom = "0";
        } else {
          popupRef.current.style.bottom = "100%";
          popupRef.current.style.top = "auto";
          popupRef.current.style.marginBottom = "0.5rem";
          popupRef.current.style.marginTop = "0";
        }
      }
    }, [showReactions, isOwnMessage]);

    return (
      <>
        <button
          ref={buttonRef}
          className={`absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-600 rounded-full text-gray-400 hover:text-gray-200 bg-gray-800 shadow-sm ${
            isOwnMessage ? "-left-7" : "-right-7"
          }`}
          onClick={() => setShowReactions(!showReactions)}
          onBlur={() => setTimeout(() => setShowReactions(false), 200)}
        >
          <span>😀</span>
        </button>
        {showReactions && (
          <div
            ref={popupRef}
            className={`absolute bg-gray-800 rounded-lg shadow-lg p-2 z-50 ${
              isOwnMessage ? "left-0" : "right-0"
            }`}
            style={{ minWidth: "200px" }}
          >
            <div className="grid grid-cols-4 gap-2">
              {REACTIONS.map((reaction) => {
                const userHasReacted = userReactions.includes(reaction);
                return (
                  <button
                    key={reaction}
                    className={`p-2 rounded-lg transition-colors ${
                      userHasReacted
                        ? "bg-indigo-600 text-white"
                        : "hover:bg-gray-700 text-gray-200"
                    }`}
                    onClick={() => {
                      onReaction(messageId, reaction);
                      setShowReactions(false);
                    }}
                  >
                    {reaction}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </>
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
      <div
        className={`flex ${
          isNotification
            ? "justify-center"
            : isOwnMessage
            ? "justify-end"
            : "justify-start"
        } mb-2`}
      >
        <div
          className={`max-w-[70%] rounded-lg px-4 py-2 ${
            isNotification
              ? "bg-gray-700/50 text-gray-300 text-sm"
              : isOwnMessage
              ? "bg-indigo-600 text-white"
              : "bg-gray-700 text-white"
          }`}
        >
          {!isNotification && sender && sender !== username && (
            <div className="text-xs text-gray-300 mb-1">{sender}</div>
          )}
          {children}
        </div>
      </div>
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
    userReactions,
  }: {
    message: DisplayMessage;
    isNotification: boolean;
    isOwnMessage: boolean;
    username: string;
    onReaction: (messageId: number | undefined, reaction: string) => void;
    onImageClick: (imageData: string) => void;
    userReactions: string[];
  }) => {
    if (message.imageData) {
      return (
        <div className="relative group">
          {!isNotification && (
            <ReactionButton
              isOwnMessage={isOwnMessage}
              onReaction={onReaction}
              messageId={message.id}
              userReactions={userReactions}
            />
          )}
          <img
            src={message.imageData}
            alt="Shared"
            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            style={{ maxHeight: "300px" }}
            onClick={() => onImageClick(message.imageData!)}
          />
          {!isNotification && (
            <MessageReactions message={message} currentUsername={username} />
          )}
        </div>
      );
    }

    return (
      <div className="relative group">
        {!isNotification && (
          <ReactionButton
            isOwnMessage={isOwnMessage}
            onReaction={onReaction}
            messageId={message.id}
            userReactions={userReactions}
          />
        )}
        <div className="break-words whitespace-pre-wrap">
          {makeLinksClickable(message.content || "")}
        </div>
        {!isNotification && (
          <MessageReactions message={message} currentUsername={username} />
        )}
      </div>
    );
  }
);

// Memoize the Message component
const Message = memo(
  ({
    message,
    username,
    onReaction,
    onImageClick,
  }: {
    message: DisplayMessage;
    username: string;
    onReaction: (messageId: number | undefined, reaction: string) => void;
    onImageClick: (imageData: string) => void;
  }) => {
    const isNotification = message.type === "notification";
    const isOwnMessage = message.sender === username;
    const userReactions =
      message.reactions
        ?.filter((r) => r.username === username)
        .map((r) => r.reaction) || [];

    return (
      <MessageContainer
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
          onReaction={onReaction}
          onImageClick={onImageClick}
          userReactions={userReactions}
        />
        {!isNotification && (
          <div className="text-xs text-gray-300 mt-1">
            {new Date(message.timestamp || "").toLocaleTimeString()}
          </div>
        )}
      </MessageContainer>
    );
  }
);

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error in component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-500 bg-red-100 rounded">
          Something went wrong. Please try refreshing the page.
        </div>
      );
    }

    return this.props.children;
  }
}

function ChatWindow({
  messages,
  sendMessage,
  loadMoreHistory,
  hasMoreHistory,
  username,
  onDisconnect,
}: ChatWindowProps) {
  const [messageInput, setMessageInput] = useState<string>("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const textBoxRef = useRef<HTMLInputElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const initialLoadDoneRef = useRef<boolean>(false);
  const oldScrollHeightRef = useRef<number>(0);
  const oldScrollTopRef = useRef<number>(0);
  const pendingScrollAdjustmentRef = useRef<boolean>(false);
  const prevMessagesLengthRef = useRef<number>(0);
  const observerRef = useRef<MutationObserver | null>(null);

  const handleMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessageInput(e.target.value);
    },
    []
  );

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (messageInput.trim()) {
        sendMessage(messageInput.trim());
        setMessageInput("");
        setIsEmojiPickerOpen(false);
      }
      textBoxRef.current?.focus();
    },
    [messageInput, sendMessage]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64Data = event.target?.result as string;
              sendMessage("", {
                type: "image",
                imageData: base64Data,
                imageType: file.type,
              });
            };
            reader.readAsDataURL(file);
          }
        }
      }
    },
    [sendMessage]
  );

  const toggleEmojiPicker = useCallback(() => {
    setIsEmojiPickerOpen((prev) => !prev);
    textBoxRef.current?.focus();
  }, []);

  const addEmoji = useCallback((emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    setIsEmojiPickerOpen(false);
    textBoxRef.current?.focus();
  }, []);

  const handleReaction = useCallback(
    (messageId: number | undefined, reaction: string) => {
      if (messageId === undefined) {
        console.error("Message ID is undefined");
        return;
      }

      // Send the reaction with the database message ID
      sendMessage("", {
        type: "reaction",
        reactionToId: messageId,
        reaction: reaction,
      });
    },
    [sendMessage]
  );

  // Handle scroll to load more history
  useEffect(() => {
    const chatMessages = chatMessagesRef.current;
    if (!chatMessages) return;

    const handleScroll = () => {
      if (chatMessages.scrollTop === 0 && hasMoreHistory && !isLoadingMore) {
        oldScrollHeightRef.current = chatMessages.scrollHeight;
        oldScrollTopRef.current = chatMessages.scrollTop;
        pendingScrollAdjustmentRef.current = true;
        setIsLoadingMore(true);
        loadMoreHistory();
      }
    };

    chatMessages.addEventListener("scroll", handleScroll);
    return () => chatMessages.removeEventListener("scroll", handleScroll);
  }, [hasMoreHistory, loadMoreHistory, isLoadingMore]);

  // Set up MutationObserver to handle scroll position adjustments
  useEffect(() => {
    if (!chatMessagesRef.current) return;

    observerRef.current = new MutationObserver(() => {
      if (pendingScrollAdjustmentRef.current && chatMessagesRef.current) {
        const chatMessages = chatMessagesRef.current;
        const newScrollHeight = chatMessages.scrollHeight;
        const scrollDiff = newScrollHeight - oldScrollHeightRef.current;

        // Apply scroll adjustment immediately when DOM changes
        chatMessages.scrollTop = oldScrollTopRef.current + scrollDiff;
        pendingScrollAdjustmentRef.current = false;
        setIsLoadingMore(false);
      }
    });

    observerRef.current.observe(chatMessagesRef.current, {
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
        if (chatMessagesRef.current) {
          chatMessagesRef.current.scrollTop =
            chatMessagesRef.current.scrollHeight;
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
        if (chatMessagesRef.current) {
          chatMessagesRef.current.scrollTop =
            chatMessagesRef.current.scrollHeight;
        }
      });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isLoadingMore]);

  return (
    <ErrorBoundary>
      <div
        className="relative flex flex-col h-full rounded-lg p-4 shadow"
        style={{ backgroundColor: "rgba(23, 33, 43, 0.95)" }}
      >
        {/* Header */}
        <div className="flex-shrink-0 mb-4 flex items-center justify-between border-b border-gray-500 pb-2">
          <button
            onClick={onDisconnect}
            className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition duration-300 hover:bg-red-700"
          >
            Disconnect
          </button>
        </div>

        {/* Chat Messages Area */}
        <div
          id="chatMessages"
          ref={chatMessagesRef}
          className="flex-1 overflow-y-auto min-h-0 space-y-2 pb-5"
        >
          {/* Load More Indicator */}
          {hasMoreHistory && (
            <div className="flex justify-center py-2">
              <div className="text-sm text-gray-400">
                {isLoadingMore
                  ? "Loading more messages..."
                  : "Scroll up to load more"}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <Message
              key={
                message.id
                  ? `msg-${message.id}`
                  : `msg-${message.timestamp}-${message.sender}`
              }
              message={message}
              username={username}
              onReaction={handleReaction}
              onImageClick={setSelectedImage}
            />
          ))}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="mt-4">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              ref={emojiButtonRef}
              onClick={toggleEmojiPicker}
              className="text-gray-400 hover:text-gray-300"
            >
              😊
            </button>
            <input
              ref={textBoxRef}
              type="text"
              value={messageInput}
              onChange={handleMessageChange}
              onPaste={handlePaste}
              placeholder="Type a message..."
              className="flex-1 rounded-lg bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>

        {/* Emoji Picker */}
        {isEmojiPickerOpen && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-20 left-4 rounded-lg bg-gray-800 p-2 shadow-lg"
          >
            <div className="grid grid-cols-8 gap-1">
              {emojis.map((emoji, index) => (
                <button
                  key={`emoji-${emoji}-${index}`}
                  onClick={() => addEmoji(emoji)}
                  className="hover:bg-gray-700 rounded p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Image Viewer */}
        {selectedImage && (
          <ImageViewer
            imageUrl={selectedImage}
            onClose={() => setSelectedImage(null)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(ChatWindow);
