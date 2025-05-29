import React, { useState, useEffect, useRef } from "react";
import type { ChatWindowProps, DisplayMessage } from "../types";
import emojis from "../emojis";

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
  username,
  onDisconnect,
}: ChatWindowProps) {
  const [messageInput, setMessageInput] = useState<string>("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const textBoxRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessage(messageInput.trim());
      setMessageInput("");
      setIsEmojiPickerOpen(false);
    }
    textBoxRef.current?.focus();
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
        className="flex-1 overflow-y-auto min-h-0 space-y-2"
      >
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
            {msg.type === "notification" ? (
              <div className="mx-auto rounded-full bg-gray-600/80 px-3 py-1 text-center text-sm italic text-gray-100 max-w-fit shadow-sm">
                {msg.content}
              </div>
            ) : (
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
                  msg.sender === username
                    ? "bg-indigo-500/80 text-white"
                    : "bg-slate-600/80 text-gray-100"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-indigo-100">
                    {msg.sender}
                  </span>
                  {msg.timestamp && (
                    <span className="text-xs text-gray-300 ml-2">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <div className="break-words text-gray-50">
                  {makeLinksClickable(msg.content)}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="mt-auto flex space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            className="w-full rounded-md border border-gray-500 bg-gray-800 px-4 py-2 pr-12 shadow-sm focus:border-blue-400 focus:ring-blue-400 text-gray-100 placeholder-gray-400"
            placeholder="Type your message..."
            ref={textBoxRef}
            value={messageInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMessageInput(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button
            type="button"
            ref={emojiButtonRef}
            onClick={toggleEmojiPicker}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-2xl hover:bg-gray-600 text-gray-300"
            title="Pick an emoji"
          >
            😊
          </button>

          {isEmojiPickerOpen && (
            <div
              id="emojiPicker"
              ref={emojiPickerRef}
              className={`absolute bottom-full right-0 z-10 mb-2 grid w-[200px] grid-cols-5 gap-1 rounded-lg border border-gray-600 bg-gray-800 p-2 shadow-lg transition-all duration-200 ease-out ${
                isEmojiPickerOpen
                  ? "translate-y-0 opacity-100 visible pointer-events-auto"
                  : "translate-y-2 opacity-0 invisible pointer-events-none"
              }`}
            >
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="rounded p-1 text-xl hover:bg-gray-100"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          className="rounded-md bg-indigo-500/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-300 hover:bg-indigo-600/90"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;
