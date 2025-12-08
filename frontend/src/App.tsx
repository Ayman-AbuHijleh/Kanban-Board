import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import router from "./routes/index.tsx";
import websocketService from "./services/websocketService";

export default function App() {
  useEffect(() => {
    // Connect to WebSocket if user is already logged in
    const token = localStorage.getItem("token");
    if (token && !websocketService.isConnected()) {
      websocketService.connect(token);
    }
  }, []);

  return <RouterProvider router={router} />;
}
