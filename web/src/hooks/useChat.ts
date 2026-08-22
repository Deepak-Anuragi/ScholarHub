import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export type ChatMessage = {
  _id: string;
  senderId: string | { _id: string; name: string; avatarUrl?: string };
  receiverId: string;
  content: string;
  isRead?: boolean;
  libraryId?: string;
  createdAt: string;
};

export function useChat(currentUserId?: string, token?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const authToken =
      token ||
      (typeof window !== "undefined"
        ? localStorage.getItem("scholars_token") ||
          localStorage.getItem("token") ||
          ""
        : "");

    const socket = io(apiUrl, {
      auth: { token: authToken },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("message_received", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on("user_typing", () => {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
    });

    socket.on("messages_read", () => {
      setMessages((prev) =>
        prev.map((m) => ({ ...m, isRead: true }))
      );
    });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.disconnect();
    };
  }, [token]);

  const joinRoom = useCallback(
    (otherId: string) => {
      if (!currentUserId || !otherId) return;
      const roomId = [currentUserId, otherId].sort().join("_");
      socketRef.current?.emit("join_room", roomId);
    },
    [currentUserId]
  );

  const sendMessage = useCallback(
    (to: string, content: string, libraryId?: string) => {
      if (!to || !content.trim()) return;
      socketRef.current?.emit("send_message", {
        to,
        content: content.trim(),
        libraryId,
      });
    },
    []
  );

  const sendTyping = useCallback((to: string) => {
    if (!to) return;
    socketRef.current?.emit("typing", { to });
  }, []);

  const markRead = useCallback((from: string) => {
    if (!from) return;
    socketRef.current?.emit("read_messages", { from });
  }, []);

  return {
    messages,
    setMessages,
    isTyping,
    joinRoom,
    sendMessage,
    sendTyping,
    markRead,
    socket: socketRef.current,
  };
}
