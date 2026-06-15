"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Message = {
  _id: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

export default function ChatPage() {
  const { user } = useAuth();
  const [messages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-[calc(100dvh-var(--header-height,0px))] flex-col px-4 py-6 sm:px-6 lg:px-8 lg:h-screen">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-4">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
            Chat
          </h1>
          <p className="mt-1 text-sm text-forest-900/60">
            Message library owners directly
          </p>
        </div>
      </AnimatedContent>

      <AnimatedContent
        distance={20}
        duration={0.45}
        threshold={0}
        delay={0.05}
        className="flex flex-1 flex-col overflow-hidden rounded-card border border-line bg-white shadow-soft"
      >
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <MessageCircle className="size-10 text-forest-900/20" />
              <p className="mt-3 text-sm font-semibold text-forest-900">
                No messages yet
              </p>
              <p className="mt-1 text-xs text-forest-900/50">
                Start a conversation with a library owner from their listing page.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.senderId === user?.id;
              return (
                <div
                  key={m._id}
                  className={cn(
                    "flex",
                    isMine ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-xs rounded-2xl px-4 py-2 text-sm",
                      isMine
                        ? "bg-[#16a34a] text-white"
                        : "bg-sage-100 text-forest-900"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-line p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                // TODO: send message
                setInput("");
              }
            }}
            placeholder="Type a message…"
            className="flex-1 rounded-2xl border border-line bg-sage-100/40 px-4 py-2.5 text-sm text-forest-900 outline-none transition focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20"
          />
          <Button
            size="icon"
            className="shrink-0 bg-[#16a34a] text-white hover:bg-[#15803d]"
            disabled={!input.trim()}
            onClick={() => setInput("")}
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </AnimatedContent>
    </div>
  );
}
