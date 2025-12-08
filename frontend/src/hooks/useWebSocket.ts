import { useEffect } from "react";
import websocketService from "../services/websocketService";

export const useWebSocket = (boardId?: string) => {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Connect if not already connected
    if (!websocketService.isConnected()) {
      websocketService.connect(token);
    }

    // Join board if boardId is provided
    if (boardId) {
      websocketService.joinBoard(boardId);
    }

    return () => {
      // Leave board when component unmounts
      if (boardId) {
        websocketService.leaveBoard(boardId);
      }
    };
  }, [boardId]);

  return websocketService;
};
