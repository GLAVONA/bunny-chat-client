// src/components/ChatSetup.tsx

import React, { useState, useCallback, memo } from "react";
import {
  TextInput,
  Button,
  Paper,
  Title,
  Stack,
  Container,
} from "@mantine/core";
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
    <Container size="xs" py="xl">
      <Paper shadow="md" p="xl" radius="md" withBorder>
        <Title order={2} ta="center" mb="lg">
          Join the Chat
        </Title>
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Enter your username"
              placeholder="Your username"
              value={inputUsername}
              onChange={handleUsernameChange}
              required
            />

            <TextInput
              label="Authentication Token"
              type="password"
              placeholder="Paste your auth token here (e.g., supersecrettoken1)"
              value={inputToken}
              onChange={handleTokenChange}
            />

            <Button type="submit" loading={isLoading} fullWidth>
              {isLoading ? "Connecting..." : "Join Chat"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
});

export default ChatSetup;
