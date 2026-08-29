"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  Send,
  CheckCheck,
  Check,
  User,
  MessageSquare,
  ArrowLeft,
  Circle,
} from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Thread = {
  threadId: string;
  otherId: string;
  otherUser: {
    _id: string;
    name: string;
    avatarUrl?: string;
    role?: string;
  } | null;
  lastMessage: {
    _id: string;
    content: string;
    createdAt: string;
    senderId: string;
    receiverId: string;
  };
  unreadCount: number;
};

type ChatWindowProps = {
  currentUserId: string;
  token?: string;
  readOnly?: boolean;
};

function fmtTime(d: string) {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function ChatWindow({ currentUserId, token, readOnly = false }: ChatWindowProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [search, setSearch] = useState("");
  const [activeOtherId, setActiveOtherId] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<Thread["otherUser"]>(null);
  const [inputText, setInputText] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    setMessages,
    isTyping,
    joinRoom,
    sendMessage,
    sendTyping,
    markRead,
  } = useChat(currentUserId, token);

  // Load threads on mount
  useEffect(() => {
    setLoadingThreads(true);
    api
      .get<{ threads?: Thread[] }>("/chat/threads")
      .then((res) => {
        const list = res.threads ?? [];
        setThreads(list);
        if (list.length > 0 && !activeOtherId) {
          setActiveOtherId(list[0].otherId);
          setActiveUser(list[0].otherUser);
        }
      })
      .catch((err) => console.error("Failed to load threads:", err))
      .finally(() => setLoadingThreads(false));
  }, []);

  // When activeOtherId changes, load messages and join socket room
  useEffect(() => {
    if (!activeOtherId) return;

    joinRoom(activeOtherId);
    markRead(activeOtherId);

    setLoadingMessages(true);
    api
      .get<{ messages?: ChatMessage[] }>(`/chat/${activeOtherId}`)
      .then((res) => {
        setMessages(res.messages ?? []);
        // Clear unread count for this thread locally
        setThreads((prev) =>
          prev.map((t) =>
            t.otherId === activeOtherId ? { ...t, unreadCount: 0 } : t
          )
        );
      })
      .catch((err) => console.error("Failed to load chat messages:", err))
      .finally(() => setLoadingMessages(false));
  }, [activeOtherId, joinRoom, markRead, setMessages]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Listen to incoming messages and update threads list
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    setThreads((prev) => {
      const otherId =
        typeof last.senderId === "object"
          ? last.senderId._id
          : last.senderId === currentUserId
          ? last.receiverId
          : last.senderId;

      const existingIndex = prev.findIndex((t) => t.otherId === otherId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const current = updated[existingIndex];
        updated[existingIndex] = {
          ...current,
          lastMessage: {
            _id: last._id,
            content: last.content,
            createdAt: last.createdAt,
            senderId: typeof last.senderId === "object" ? last.senderId._id : last.senderId,
            receiverId: last.receiverId,
          },
          unreadCount:
            otherId === activeOtherId
              ? 0
              : current.unreadCount + (last.senderId !== currentUserId ? 1 : 0),
        };
        // Move to top
        const item = updated.splice(existingIndex, 1)[0];
        return [item, ...updated];
      }
      return prev;
    });
  }, [messages, activeOtherId, currentUserId]);

  const handleSend = () => {
    if (!activeOtherId || !inputText.trim() || readOnly) return;
    const text = inputText.trim();
    sendMessage(activeOtherId, text);

    // Optimistic local add
    const optimisticMsg: ChatMessage = {
      _id: `temp_${Date.now()}`,
      senderId: currentUserId,
      receiverId: activeOtherId,
      content: text,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (activeOtherId && !readOnly) {
      sendTyping(activeOtherId);
    }
  };

  const filteredThreads = threads.filter((t) => {
    if (!search.trim()) return true;
    const name = t.otherUser?.name?.toLowerCase() ?? "";
    const msg = t.lastMessage?.content?.toLowerCase() ?? "";
    const q = search.toLowerCase();
    return name.includes(q) || msg.includes(q);
  });

  return (
    <div className="flex h-[calc(100vh-100px)] w-full overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
      {/* LEFT PANEL: Thread List */}
      <div
        className={cn(
          "flex w-full flex-col border-r border-line bg-sage-100/30 sm:w-80 md:w-96 shrink-0",
          activeOtherId ? "hidden sm:flex" : "flex"
        )}
      >
        {/* Header & Search */}
        <div className="border-b border-line p-4">
          <h2 className="font-display text-lg font-bold text-forest-900">
            Messages
          </h2>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-2.5 size-4 text-forest-900/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages…"
              className="h-9 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-xs text-forest-900 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20"
            />
          </div>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingThreads ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-white/60" />
              ))}
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="py-12 text-center text-xs text-forest-900/50">
              No conversations found.
            </div>
          ) : (
            filteredThreads.map((t) => {
              const isActive = t.otherId === activeOtherId;
              const initials = (t.otherUser?.name ?? "U")
                .split(" ")
                .slice(0, 2)
                .map((p) => p[0])
                .join("")
                .toUpperCase();

              return (
                <button
                  key={t.threadId}
                  onClick={() => {
                    setActiveOtherId(t.otherId);
                    setActiveUser(t.otherUser);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl p-3 text-left transition",
                    isActive
                      ? "bg-[#16a34a]/10 border border-[#16a34a]/20 shadow-sm"
                      : "hover:bg-white/80"
                  )}
                >
                  <div className="relative">
                    <Avatar className="size-11">
                      {t.otherUser?.avatarUrl && (
                        <AvatarImage
                          src={t.otherUser.avatarUrl}
                          alt={t.otherUser.name}
                        />
                      )}
                      <AvatarFallback className="bg-[#16a34a]/15 font-bold text-[#16a34a]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-xs font-bold text-forest-900">
                        {t.otherUser?.name ?? "User"}
                      </p>
                      <span className="text-[10px] text-forest-900/40">
                        {fmtTime(t.lastMessage?.createdAt)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-1">
                      <p className="truncate text-xs text-forest-900/60">
                        {t.lastMessage?.content ?? "No messages yet"}
                      </p>
                      {t.unreadCount > 0 && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-[#16a34a] text-[9px] font-bold text-white shrink-0">
                          {t.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Active Chat */}
      <div
        className={cn(
          "flex flex-1 flex-col bg-white",
          !activeOtherId ? "hidden sm:flex" : "flex"
        )}
      >
        {activeOtherId && activeUser ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveOtherId(null)}
                  className="rounded-lg p-1 text-forest-900/50 hover:bg-sage-100 sm:hidden"
                >
                  <ArrowLeft className="size-5" />
                </button>
                <Avatar className="size-10">
                  {activeUser.avatarUrl && (
                    <AvatarImage src={activeUser.avatarUrl} alt={activeUser.name} />
                  )}
                  <AvatarFallback className="bg-[#16a34a]/15 font-bold text-[#16a34a]">
                    {activeUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-forest-900">
                    {activeUser.name}
                  </p>
                  <p className="text-[11px] text-forest-900/50 flex items-center gap-1">
                    <Circle className="size-2 fill-[#16a34a] text-[#16a34a]" />
                    {isTyping ? (
                      <span className="font-medium text-[#16a34a] animate-pulse">
                        typing…
                      </span>
                    ) : (
                      "Active now"
                    )}
                  </p>
                </div>
              </div>
              {readOnly && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  Read Only (Admin View)
                </span>
              )}
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-sage-100/10">
              {loadingMessages ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-12 w-48 animate-pulse rounded-2xl bg-sage-100",
                        i % 2 === 0 ? "ml-auto" : "mr-auto"
                      )}
                    />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-xs text-forest-900/40">
                  <MessageSquare className="size-8 text-forest-900/20 mb-2" />
                  No messages in this chat yet. Say hi!
                </div>
              ) : (
                messages.map((m) => {
                  const senderIdStr =
                    typeof m.senderId === "object" ? m.senderId._id : m.senderId;
                  const isMine = senderIdStr === currentUserId;

                  return (
                    <AnimatedContent
                      key={m._id}
                      distance={10}
                      duration={0.3}
                      threshold={0}
                    >
                      <div
                        className={cn(
                          "flex flex-col max-w-[75%] sm:max-w-[65%]",
                          isMine ? "ml-auto items-end" : "mr-auto items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm",
                            isMine
                              ? "bg-[#16a34a] text-white rounded-br-none"
                              : "bg-white border border-line text-forest-900 rounded-bl-none"
                          )}
                        >
                          {m.content}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-forest-900/40 px-1">
                          <span>{fmtTime(m.createdAt)}</span>
                          {isMine && (
                            <span>
                              {m.isRead ? (
                                <CheckCheck className="size-3 text-[#16a34a]" />
                              ) : (
                                <Check className="size-3 text-forest-900/30" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </AnimatedContent>
                  );
                })
              )}

              {/* Typing indicator bubble */}
              {isTyping && (
                <div className="mr-auto flex items-center gap-1.5 rounded-2xl rounded-bl-none border border-line bg-white px-4 py-2 text-xs text-forest-900/50">
                  <span className="size-1.5 animate-bounce rounded-full bg-[#16a34a]" />
                  <span
                    className="size-1.5 animate-bounce rounded-full bg-[#16a34a]"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="size-1.5 animate-bounce rounded-full bg-[#16a34a]"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            {!readOnly && (
              <div className="border-t border-line p-3 bg-white">
                <div className="flex items-end gap-2 rounded-2xl border border-line bg-sage-100/30 p-2 focus-within:border-[#16a34a] focus-within:ring-2 focus-within:ring-[#16a34a]/20">
                  <textarea
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                    className="flex-1 max-h-24 min-h-[36px] resize-none bg-transparent px-2 py-1.5 text-xs sm:text-sm text-forest-900 outline-none"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    size="icon"
                    className="size-8 rounded-xl bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-40"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty Chat State */
          <div className="flex h-full flex-col items-center justify-center p-6 text-center text-forest-900/50">
            <div className="flex size-16 items-center justify-center rounded-3xl bg-[#16a34a]/10 mb-3">
              <MessageSquare className="size-8 text-[#16a34a]" />
            </div>
            <p className="font-display text-lg font-bold text-forest-900">
              Your Messages
            </p>
            <p className="mt-1 text-xs max-w-xs text-forest-900/60">
              Select a conversation from the sidebar or start a new chat with a library owner or student.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
