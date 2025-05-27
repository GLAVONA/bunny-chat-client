import React, { useState, useEffect, useRef } from "react";
import type { ChatWindowProps, DisplayMessage } from "../types";
import emojis from "../emojis";

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
  };

  const addEmoji = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    setIsEmojiPickerOpen(false);
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
      className="relative flex flex-col flex-1 rounded-lg bg-white p-4 shadow"
      style={{ backgroundColor: "rgba(255, 255, 255, 0.6)" }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-2">
        <h2 className="text-xl font-bold text-gray-800">Chat Room</h2>
        <button
          onClick={onDisconnect}
          className="rounded-md bg-red-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition duration-300 hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>

      {/* Chat Messages Area */}
      <div
        id="chatMessages"
        className="mb-4 flex-1 overflow-y-auto pr-2 scrollbar-thumb-gray-400 scrollbar-track-gray-200 scrollbar-thin space-y-2" // Tailwind scrollbar classes (requires plugin)
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
              <div className="mx-auto rounded-full bg-gray-300 px-3 py-1 text-center text-sm italic text-gray-700 max-w-fit shadow-sm">
                {msg.content}
              </div>
            ) : (
              <div
                className={`max-w-[70%] rounded-lg p-3 shadow-sm break-words whitespace-pre-wrap ${
                  msg.sender === username
                    ? "ml-auto rounded-br-none bg-blue-500 text-white" // Sent message styles
                    : "mr-auto rounded-bl-none bg-green-100 text-gray-900" // Received message styles
                }`}
              >
                {msg.sender !== username && (
                  <div className="mb-1 text-xs font-semibold text-gray">
                    {msg.sender}
                  </div>
                )}
                <div>{msg.content}</div>
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
            className="w-full rounded-md border border-gray-300 px-4 py-2 pr-12 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-2xl hover:bg-gray-200"
            title="Pick an emoji"
          >
            😊
          </button>

          {isEmojiPickerOpen && (
            <div
              id="emojiPicker"
              ref={emojiPickerRef}
              className={`absolute bottom-full left-0 z-10 mb-2 grid w-[200px] grid-cols-5 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg transition-all duration-200 ease-out ${
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
          className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-md transition duration-300 hover:bg-blue-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;
