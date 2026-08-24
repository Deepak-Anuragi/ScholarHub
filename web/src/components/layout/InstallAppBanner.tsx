"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (!prompt || dismissed) return null;

  const install = async () => {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setPrompt(null);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-lift dark:bg-background">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#16a34a]/10 text-xl" aria-hidden="true">📚</span>
      <p className="min-w-0 flex-1 text-sm font-semibold text-forest-900 dark:text-foreground">
        Install Scholar&apos;s Hub for quick access
      </p>
      <Button size="sm" onClick={() => void install()} className="shrink-0 bg-[#16a34a] text-white hover:bg-[#15803d]">
        <Download className="size-4" /> Install
      </Button>
      <button type="button" aria-label="Dismiss install banner" onClick={() => setDismissed(true)} className="shrink-0 rounded-full p-1 text-forest-900/50 hover:bg-sage-100 hover:text-forest-900">
        <X className="size-4" />
      </button>
    </div>
  );
}
