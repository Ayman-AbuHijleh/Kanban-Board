import { io, Socket } from "socket.io-client";
import { VITE_WS_URL } from "./config";

class WebSocketService {
  private socket: Socket | null = null;
  private currentBoardId: string | null = null;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    const baseUrl = VITE_WS_URL || "http://localhost:5000";

    console.log("🔌 Connecting to WebSocket:", baseUrl);

    this.socket = io(baseUrl, {
      auth: {
        token,
      },
      query: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
      // Rejoin board if we were in one
      if (this.currentBoardId) {
        this.joinBoard(this.currentBoardId);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    // Set up event listeners for all board events
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    const events = [
      // Card events
      "card:created",
      "card:updated",
      "card:deleted",
      "card:moved",
      "card:assignee_added",
      "card:assignee_removed",
      "card:label_added",
      "card:label_removed",
      // List events
      "list:created",
      "list:updated",
      "list:deleted",
      "list:moved",
      // Board events
      "board:updated",
      "board:member_added",
      "board:member_removed",
      "board:member_role_updated",
      // Comment events
      "comment:created",
      "comment:deleted",
    ];

    events.forEach((event) => {
      this.socket?.on(event, (data) => {
        this.handleEvent(event, data);
      });
    });
  }

  private handleEvent(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in handler for ${event}:`, error);
        }
      });
    }
  }

  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.off(event, handler);
    };
  }

  off(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  joinBoard(boardId: string) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected, cannot join board");
      return;
    }

    this.currentBoardId = boardId;
    this.socket.emit("join_board", { board_id: boardId });
  }

  leaveBoard(boardId: string) {
    if (!this.socket?.connected) {
      return;
    }

    if (this.currentBoardId === boardId) {
      this.currentBoardId = null;
    }
    this.socket.emit("leave_board", { board_id: boardId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentBoardId = null;
      this.eventHandlers.clear();
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentBoardId(): string | null {
    return this.currentBoardId;
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;
