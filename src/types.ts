// src/types.ts

export type MessageType =
  | "chat"
  | "notification"
  | "user_list"
  | "join"
  | "leave"
  | "error"
  | "message" // Added 'message' as per Go's readPump
  | "history_batch";

export interface WebSocketMessage {
  type:
    | "chat"
    | "join"
    | "leave"
    | "notification"
    | "error"
    | "history_batch"
    | "user_list"; // Added 'history_batch'
  username?: string;
  content?: string;
  room?: string;
  userList?: string[];
  timestamp?: string; // Always include timestamp for chat/history items

  // NEW: Add a field for the array of historical messages
  history?: Array<{
    type: "chat"; // Historical messages are always 'chat' type for display
    username: string;
    content: string;
    room: string;
    timestamp: string;
  }>;
}

// Client-side message representation (for display)
export interface DisplayMessage {
  type: "chat" | "notification";
  sender?: string; // Optional for notification
  content: string;
  timestamp?: string; // Optional for notification (your Go backend doesn't send this for now)
}

// Props for components (these remain largely unchanged as they are for component API)
export interface ChatSetupProps {
  onConnect: (username: string, room: string, token?: string) => Promise<void>;
}

export interface ChatWindowProps {
  messages: DisplayMessage[];
  sendMessage: (content: string) => void;
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
