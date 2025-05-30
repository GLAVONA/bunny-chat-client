import React from "react";
import type { DisplayMessage } from "../types";

interface MessageReactionsProps {
  message: DisplayMessage;
  currentUsername: string;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  message,
  currentUsername,
}) => {
  return (
    <div className="relative">
      {message.reactions && message.reactions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {message.reactions.map((reaction, index) => (
            <span
              key={`${reaction.reaction}-${index}`}
              className={`text-sm px-2 py-0.5 rounded-full ${
                reaction.username === currentUsername
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700/50"
              }`}
              title={reaction.username}
            >
              {reaction.reaction}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
