"use client";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { useAuth } from "@/components/providers/auth-provider";

export default function OwnerChatPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-forest-900/50">
        Please log in to access messages.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ChatWindow currentUserId={user.id} />
    </div>
  );
}
