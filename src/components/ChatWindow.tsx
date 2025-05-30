import React, { useState, useEffect, useRef } from "react";
import type { ChatWindowProps, DisplayMessage } from "../types";
import emojis from "../emojis";
import ImageViewer from "./ImageViewer";

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessage(messageInput.trim());
      setMessageInput("");
      setIsEmojiPickerOpen(false);
    }
    textBoxRef.current?.focus();
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Data = event.target?.result as string;
            // Send image message
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
  };

  const toggleEmojiPicker = () => {
    setIsEmojiPickerOpen((prev) => !prev);
    textBoxRef.current?.focus();
  };

  const addEmoji = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    setIsEmojiPickerOpen(false);
    textBoxRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setIsEmojiPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle scroll to load more history
  useEffect(() => {
    const chatMessages = chatMessagesRef.current;
    if (!chatMessages) return;

    const handleScroll = () => {
      if (chatMessages.scrollTop === 0 && hasMoreHistory && !isLoadingMore) {
        // Save current scroll position and height before loading more
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

  return (
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

        {messages.map((msg: DisplayMessage, index: number) => (
          <div
            key={index}
            className={`flex ${
              msg.type === "notification"
                ? "justify-center"
                : msg.sender === username
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.type === "notification"
                  ? "bg-gray-700/50 text-gray-300 text-sm"
                  : msg.sender === username
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-white"
              }`}
            >
              {msg.type === "notification" ? (
                <span>{msg.content}</span>
              ) : msg.type === "image" ? (
                <div className="space-y-1">
                  {msg.sender && (
                    <div className="text-xs text-gray-300">{msg.sender}</div>
                  )}
                  <img
                    src={msg.imageData}
                    alt="Shared image"
                    className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ maxHeight: "300px" }}
                    onClick={() =>
                      msg.imageData && setSelectedImage(msg.imageData)
                    }
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  {msg.sender && (
                    <div className="text-xs text-gray-300">{msg.sender}</div>
                  )}
                  <div className="wrap-break-word">
                    {makeLinksClickable(msg.content || "")}
                  </div>
                </div>
              )}
            </div>
          </div>
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
            onChange={(e) => setMessageInput(e.target.value)}
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
                key={index}
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
  );
}

export default ChatWindow;
