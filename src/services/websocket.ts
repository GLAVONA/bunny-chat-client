import type { WebSocketMessage } from "../types";
import { AuthService } from "./auth";

interface WebSocketWithCredentials extends WebSocket {
  credentials?: "include" | "omit" | "same-origin";
}

type MessageHandler = (data: WebSocketMessage) => void;
type ErrorHandler = (error: Event) => void;
type CloseHandler = (event: CloseEvent) => void;
type OpenHandler = () => void;

export class WebSocketService {
  private ws: WebSocketWithCredentials | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private closeHandlers: Set<CloseHandler> = new Set();
  private openHandlers: Set<OpenHandler> = new Set();
  isConnecting = false;

  constructor(
    private username: string,
    private room: string,
    private token: string
  ) {
    console.log("WebSocketService constructor called with:", {
      username,
      room,
      hasToken: !!token,
    });
    this.initialize();
  }

  private async initialize() {
    try {
      // First authenticate to get a session
      if (this.token) {
        await AuthService.authenticate(this.username, this.token, this.room);
      }

      // Check if we have a valid session
      const session = await AuthService.checkSession();
      if (!session.valid) {
        throw new Error("No valid session found");
      }

      // Now connect the WebSocket
      this.connect();
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
      this.handleError(new Event("error"));
    }
  }

  private getWebSocketUrl(): string {
    // Use relative URL for WebSocket to work with Vite's proxy
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const params = new URLSearchParams();

    // Ensure parameters are properly encoded
    if (this.username) params.append("username", this.username);
    if (this.room) params.append("room", this.room);
    if (this.token) params.append("token", this.token);

    // In development, use the current host if it's an IP address, otherwise use localhost
    const isDev = import.meta.env.DEV;
    const devPort = import.meta.env.VITE_WS_PORT || "8080";
    const isLocalIP =
      window.location.hostname.startsWith("192.168.") ||
      window.location.hostname.startsWith("127.");
    const host =
      isDev && !isLocalIP ? `localhost:${devPort}` : window.location.host;
    const url = `${protocol}//${host}/ws?${params.toString()}`;

    console.log("Generated WebSocket URL:", {
      url,
      isDev,
      host,
      currentHost: window.location.host,
      devPort,
      isLocalIP,
    });
    return url;
  }

  private connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connecting or connected:", {
        isConnecting: this.isConnecting,
        readyState: this.ws?.readyState,
      });
      return;
    }

    this.isConnecting = true;
    try {
      const wsUrl = this.getWebSocketUrl();
      console.log("Attempting WebSocket connection:", {
        url: wsUrl,
        username: this.username,
        room: this.room,
        hasToken: !!this.token,
      });

      // Create WebSocket with credentials
      this.ws = new WebSocket(wsUrl) as WebSocketWithCredentials;
      this.ws.credentials = "include";

      // Disable compression if available
      if ("perMessageDeflate" in this.ws) {
        (
          this.ws as WebSocket & { perMessageDeflate: boolean }
        ).perMessageDeflate = false;
      }

      this.setupEventHandlers();
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      this.handleError(new Event("error"));
      this.isConnecting = false;
    }
  }

  private setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log("WebSocket connection established:", {
        readyState: this.ws?.readyState,
        protocol: this.ws?.protocol,
        url: this.ws?.url,
        extensions: this.ws?.extensions,
      });
      this.isConnecting = false;
      this.openHandlers.forEach((handler) => handler());
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        console.log("Received WebSocket message:", {
          type: data.type,
          data: data,
          readyState: this.ws?.readyState,
          protocol: this.ws?.protocol,
        });
        this.messageHandlers.forEach((handler) => handler(data));
      } catch (error) {
        console.error("Error parsing WebSocket message:", error, event.data);
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log("WebSocket connection closed:", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        readyState: this.ws?.readyState,
        url: this.ws?.url,
        protocol: this.ws?.protocol,
      });
      this.isConnecting = false;
      this.closeHandlers.forEach((handler) => handler(event));
    };

    this.ws.onerror = (error: Event) => {
      console.error("WebSocket error:", {
        error,
        readyState: this.ws?.readyState,
        url: this.ws?.url,
        protocol: this.ws?.protocol,
      });

      this.errorHandlers.forEach((handler) => handler(error));
    };
  }

  private handleError(error: Event) {
    console.error("WebSocket error:", {
      error,
      readyState: this.ws?.readyState,
      url: this.ws?.url,
      protocol: this.ws?.protocol,
    });
    this.errorHandlers.forEach((handler) => handler(error));
  }

  public sendMessage(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("Sending WebSocket message:", {
        message,
        readyState: this.ws?.readyState,
        protocol: this.ws?.protocol,
      });
      this.ws.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected:", {
        readyState: this.ws?.readyState,
        url: this.ws?.url,
        protocol: this.ws?.protocol,
      });
      throw new Error("WebSocket is not connected");
    }
  }

  public onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  public onError(handler: ErrorHandler) {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  public onClose(handler: CloseHandler) {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  public onOpen(handler: OpenHandler) {
    this.openHandlers.add(handler);
    return () => this.openHandlers.delete(handler);
  }

  public disconnect() {
    console.warn("Disconnecting WebSocket:", {
      readyState: this.ws?.readyState,
      url: this.ws?.url,
      protocol: this.ws?.protocol,
    });

    if (this.ws) {
      console.log("Closing WebSocket connection");
      try {
        this.ws.close(1000, "Client disconnecting");
      } catch (error) {
        console.error("Error during WebSocket close:", error);
      } finally {
        this.ws = null;
      }
    }

    this.isConnecting = false;
    this.messageHandlers.clear();
    this.errorHandlers.clear();
    this.closeHandlers.clear();
    this.openHandlers.clear();
  }
}
