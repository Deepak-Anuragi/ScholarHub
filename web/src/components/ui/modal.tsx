"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A centred dialog on the same Radix primitive as ui/sheet.
 *
 * The dashboards used to hand-roll `fixed inset-0 z-50` overlays, which look
 * right but are not dialogs: no role, no Escape, no focus trap, and the page
 * behind stayed scrollable and tabbable. Radix supplies all of that.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  /** Set false when the heading is drawn by the content itself. */
  showTitle = true,
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Required: it names the dialog for screen readers even when not shown. */
  title: string;
  description?: string;
  showTitle?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-forest-900/40 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
            "max-h-[calc(100vh-4rem)] overflow-y-auto rounded-card bg-white p-6 shadow-lift",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            className
          )}
        >
          <div className={cn("mb-4 flex items-center justify-between", !showTitle && "sr-only")}>
            <DialogPrimitive.Title className="font-semibold text-forest-900">
              {title}
            </DialogPrimitive.Title>
          </div>

          {description ? (
            <DialogPrimitive.Description className="sr-only">
              {description}
            </DialogPrimitive.Description>
          ) : (
            // Radix warns when a dialog has no description; say so explicitly.
            <DialogPrimitive.Description className="sr-only">
              {title}
            </DialogPrimitive.Description>
          )}

          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-full p-1 text-forest-900/50 transition hover:bg-sage-100 hover:text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </DialogPrimitive.Close>

          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
