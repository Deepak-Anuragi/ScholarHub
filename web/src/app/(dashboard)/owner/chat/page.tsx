"use client";

import { useRef } from "react";
import { MessageCircle, Send } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { Button } from "@/components/ui/button";

export default function OwnerChatPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-screen flex-col px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-4">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
            Student Messages
          </h1>
          <p className="mt-1 text-sm text-forest-900/60">
            Respond to questions from your students
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
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <MessageCircle className="size-10 text-forest-900/20" />
          <p className="mt-3 text-sm font-semibold text-forest-900">
            No messages yet
          </p>
          <p className="mt-1 text-xs text-forest-900/50">
            When students send you a message, it will appear here.
          </p>
        </div>

        <div className="border-t border-line p-3 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message…"
            className="flex-1 rounded-2xl border border-line bg-sage-100/40 px-4 py-2.5 text-sm text-forest-900 outline-none transition focus:border-forest-700"
          />
          <Button
            size="icon"
            className="shrink-0 bg-forest-700 text-white hover:bg-forest-900"
            aria-label="Send"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </AnimatedContent>
    </div>
  );
}
