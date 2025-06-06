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
  | "load_more_history"
  | "image"
  | "reaction";

export interface WebSocketMessage {
  id?: number;
  type: MessageType;
  username?: string;
  content?: string;
  room?: string;
  userList?: string[];
  timestamp?: string;
  imageData?: string;
  imageType?: string;
  reactionToId?: number;
  reaction?: string;
  replyToId?: number;
  replyTo?: {
    sender: string;
    content: string;
  };
  history?: Array<{
    id?: number;
    type: "chat" | "image" | "reaction";
    username: string;
    content?: string;
    room: string;
    timestamp: string;
    imageData?: string;
    imageType?: string;
    reactionToId?: number;
    reaction?: string;
    replyToId?: number;
    replyTo?: {
      sender: string;
      content: string;
    };
  }>;
  // Pagination fields
  pageSize?: number;
  pageToken?: string;
  hasMore?: boolean;
}

// Client-side message representation (for display)
export interface ReplyToMessage {
  sender: string;
  content: string;
  type?: "text" | "image";
  imageData?: string;
}

export interface DisplayMessage {
  id?: number;
  type: MessageType;
  sender?: string;
  content?: string;
  timestamp?: string;
  imageData?: string;
  imageType?: string;
  reactions?: Array<{
    username: string;
    reaction: string;
    timestamp: string;
  }>;
  replyToId?: number;
  replyTo?: ReplyToMessage;
}

// Props for components
export interface ChatSetupProps {
  onConnect: (username: string, room: string, token?: string) => Promise<void>;
}

export interface ChatWindowProps {
  messages: DisplayMessage[];
  sendMessage: (
    content: string,
    imageData?:
      | { type: "image"; imageData: string; imageType: string }
      | { type: "reaction"; reactionToId: number; reaction: string }
      | { type: "reply"; replyToId: number }
  ) => void;
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
