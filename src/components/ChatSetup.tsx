// src/components/ChatSetup.tsx

import React, { useState } from "react";
import type { ChatSetupProps } from "../types";

function ChatSetup({ onConnect }: ChatSetupProps) {
  const [inputUsername, setInputUsername] = useState<string>("");
  const [inputRoom] = useState<string>("");
  const [inputToken, setInputToken] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUsername.trim() && inputToken.trim()) {
      onConnect(inputUsername.trim(), inputRoom.trim(), inputToken.trim()); // Pass all three
    } else {
      alert(
        "Please fill in all fields (username, room, and authentication token)."
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Join the Chat
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Enter your username:
            </label>
            <input
              type="text"
              id="username"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={inputUsername}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInputUsername(e.target.value)
              }
              placeholder="Your username"
              required
            />
          </div>
          {/* <div>
            <label
              htmlFor="room"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Enter room name:
            </label>
            <input
              type="text"
              id="room"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={inputRoom}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInputRoom(e.target.value)
              }
              placeholder="e.g., general, gaming, tech"
            />
          </div> */}
          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Authentication Token:
            </label>
            <input
              type="password"
              id="token"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={inputToken}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInputToken(e.target.value)
              }
              placeholder="Paste your auth token here (e.g., supersecrettoken1)"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300"
          >
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatSetup;
