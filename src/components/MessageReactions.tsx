import React from "react";
import { Group, Badge, Tooltip } from "@mantine/core";

interface Reaction {
  username: string;
  reaction: string;
  timestamp: string;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  currentUsername: string;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  currentUsername,
}) => {
  return (
    <Group gap="xs">
      {reactions.map((reaction, index) => (
        <Tooltip
          key={`${reaction.reaction}-${index}`}
          label={reaction.username}
        >
          <Badge
            variant={reaction.username === currentUsername ? "filled" : "light"}
            color={reaction.username === currentUsername ? "blue" : "gray"}
          >
            {reaction.reaction}
          </Badge>
        </Tooltip>
      ))}
    </Group>
  );
};
