// src/components/ChatSetup.tsx

import React, { useState, useCallback, memo } from "react";
import type { ChatSetupProps } from "../types";

const ChatSetup = memo(function ChatSetup({ onConnect }: ChatSetupProps) {
  const [inputUsername, setInputUsername] = useState<string>("");
  const [inputRoom] = useState<string>("");
  const [inputToken, setInputToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUsernameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputUsername(e.target.value);
    },
    []
  );

  const handleTokenChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputToken(e.target.value);
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputUsername.trim()) {
        alert("Please enter a username.");
        return;
      }

      setIsLoading(true);
      try {
        await onConnect(
          inputUsername.trim(),
          inputRoom.trim(),
          inputToken.trim()
        );
      } catch (error) {
        console.error("Connection error:", error);
        alert(error instanceof Error ? error.message : "Failed to connect");
      } finally {
        setIsLoading(false);
      }
    },
    [inputUsername, inputRoom, inputToken, onConnect]
  );

  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <div className="bg-gray-800/95 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-600">
        <h2 className="text-2xl font-bold text-gray-100 mb-6 text-center">
          Join the Chat
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Enter your username:
            </label>
            <input
              type="text"
              id="username"
              className="mt-1 block w-full px-4 py-2 border border-gray-500 rounded-md shadow-sm bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
              value={inputUsername}
              onChange={handleUsernameChange}
              placeholder="Your username"
              required
            />
          </div>

          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Authentication Token:
            </label>
            <input
              type="password"
              id="token"
              className="mt-1 block w-full px-4 py-2 border border-gray-500 rounded-md shadow-sm bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
              value={inputToken}
              onChange={handleTokenChange}
              placeholder="Paste your auth token here (e.g., supersecrettoken1)"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-300 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Connecting..." : "Join Chat"}
          </button>
        </form>
      </div>
    </div>
  );
});

export default ChatSetup;
