// src/types.ts

export type MessageType =
  | "chat"
  | "notification"
  | "user_list"
  | "join"
  | "leave"
  | "error"
  | "message"
  | "history_batch"
  | "load_more_history";

export interface WebSocketMessage {
  type: MessageType;
  username?: string;
  content?: string;
  room?: string;
  userList?: string[];
  timestamp?: string;
  history?: Array<{
    type: "chat";
    username: string;
    content: string;
    room: string;
    timestamp: string;
  }>;
  // Pagination fields
  pageSize?: number;
  pageToken?: string;
  hasMore?: boolean;
}

// Client-side message representation (for display)
export interface DisplayMessage {
  type: "chat" | "notification";
  sender?: string;
  content: string;
  timestamp?: string;
}

// Props for components
export interface ChatSetupProps {
  onConnect: (username: string, room: string, token?: string) => Promise<void>;
}

export interface ChatWindowProps {
  messages: DisplayMessage[];
  sendMessage: (content: string) => void;
  loadMoreHistory: () => void;
  hasMoreHistory: boolean;
  username: string;
  roomName: string;
  onDisconnect: () => void;
}

export interface UserListProps {
  users: string[];
  currentUser: string;
  roomName: string;
}

// NOTE: JoinPayload, ChatMessagePayload etc. are now less critical for incoming messages
// because the Go struct is flat. We'll directly use properties of WebSocketMessage.
// For outgoing messages, we can still construct them clearly.
// For example, when sending a chat message from frontend:
// { type: "chat", username: "...", content: "..." }

export interface AuthResponse {
  success: boolean;
  message?: string;
  username?: string;
  room?: string;
}

export interface SessionResponse {
  valid: boolean;
  username?: string;
  room?: string;
}
