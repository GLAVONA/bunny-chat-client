import { memo } from "react";
import { Text, Paper, Stack, Badge, Group } from "@mantine/core";
import type { UserListProps } from "../types";

const UserItem = memo(
  ({ user, isCurrentUser }: { user: string; isCurrentUser: boolean }) => (
    <Paper
      p="xs"
      radius="md"
      withBorder
      bg={
        isCurrentUser
          ? "var(--mantine-color-blue-9)"
          : "var(--mantine-color-dark-6)"
      }
    >
      <Group gap="xs">
        <Badge
          size="sm"
          color={isCurrentUser ? "blue" : "green"}
          variant="filled"
        />
        <Text size="sm" fw={isCurrentUser ? 600 : 400}>
          {user} {isCurrentUser && "(You)"}
        </Text>
      </Group>
    </Paper>
  )
);

const UserList = memo(function UserList({ users, currentUser }: UserListProps) {
  return (
    <Stack>
      <Text size="xl" fw={700} c="dimmed">
        Online Users ({users.length})
      </Text>
      <Stack gap="xs">
        {users.length === 0 ? (
          <Text c="dimmed" fs="italic">
            No other users online.
          </Text>
        ) : (
          users.map((user: string, index: number) => (
            <UserItem
              key={`${user}-${index}`}
              user={user}
              isCurrentUser={user === currentUser}
            />
          ))
        )}
      </Stack>
    </Stack>
  );
});

export default UserList;
