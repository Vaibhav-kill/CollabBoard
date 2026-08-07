import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

// Backend URL from Render Environment Variable
export const API_URL = import.meta.env.VITE_API_URL;
export const SERVER_URL = API_URL;

export function SocketProvider({ children }) {
  const socketRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("disconnected");

  useEffect(() => {
    console.log("==================================");
    console.log("VITE_API_URL:", API_URL);
    console.log("==================================");

    const socket = io(API_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket Connected");
      setConnected(true);
      setStatus("connected");
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket Disconnected:", reason);
      setConnected(false);
      setStatus("disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket Connection Error:", err);
      setConnected(false);
      setStatus("disconnected");
    });

    console.log("Connecting to:", API_URL);

    setStatus("connecting");
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);

    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        emit,
        on,
        off,
        connected,
        status,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}