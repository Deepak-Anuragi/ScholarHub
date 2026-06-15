"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DigitalIDCardProps = {
  bookingId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  avatarUrl?: string;
  libraryName: string;
  libraryId: string;
  slotName?: string;
  examType?: string;
  plan: string;
  startDate: string;
  endDate: string;
};

export function DigitalIDCard({
  bookingId,
  studentId,
  studentName,
  studentEmail,
  avatarUrl,
  libraryName,
  libraryId,
  slotName,
  examType,
  plan,
  startDate,
  endDate,
}: DigitalIDCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const qrData = JSON.stringify({
    bookingId,
    studentId,
    libraryId,
    validUntil: endDate,
  });

  const initials = studentName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const handleDownload = async () => {
    const { default: html2canvas } = await import("html2canvas");
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      backgroundColor: null,
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = `scholars-hub-id-${bookingId.slice(-6)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-3">
      {/* Card */}
      <div
        ref={cardRef}
        className="w-full max-w-sm overflow-hidden rounded-[20px] bg-white shadow-lift"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        aria-label="Scholar's Hub Digital ID card"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#16a34a] to-[#4a7c2a] px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-white/20">
              <BookOpen className="size-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                Scholar's Hub
              </p>
              <p className="text-xs font-bold text-white">Student ID</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/60">Library</p>
            <p className="text-xs font-bold text-white leading-tight max-w-[120px] truncate">
              {libraryName}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex gap-4 px-5 py-4">
          {/* Avatar */}
          <div className="shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={studentName}
                className="size-16 rounded-full border-2 border-[#16a34a] object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-[#16a34a] bg-[#16a34a]/10 text-xl font-bold text-[#16a34a]">
                {initials}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-base font-bold text-forest-900 leading-tight truncate">
              {studentName}
            </p>
            <p className="text-[11px] text-forest-900/50 truncate">{studentEmail}</p>
            {examType && (
              <span className="inline-block rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-semibold text-forest-900">
                {examType}
              </span>
            )}
            <div className="pt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
              <div>
                <p className="text-forest-900/40 uppercase tracking-wide text-[9px]">Plan</p>
                <p className="font-semibold text-forest-900 capitalize">
                  {plan.toLowerCase()}
                </p>
              </div>
              {slotName && (
                <div>
                  <p className="text-forest-900/40 uppercase tracking-wide text-[9px]">Slot</p>
                  <p className="font-semibold text-forest-900">{slotName}</p>
                </div>
              )}
              <div>
                <p className="text-forest-900/40 uppercase tracking-wide text-[9px]">From</p>
                <p className="font-semibold text-forest-900">{fmt(startDate)}</p>
              </div>
              <div>
                <p className="text-forest-900/40 uppercase tracking-wide text-[9px]">Until</p>
                <p className={cn(
                  "font-semibold",
                  new Date(endDate) < new Date() ? "text-red-500" : "text-forest-900"
                )}>
                  {fmt(endDate)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* QR + booking ref */}
        <div className="flex items-end justify-between border-t border-line px-5 py-3">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-forest-900/30">
              Booking Ref
            </p>
            <p className="font-mono text-xs font-bold text-forest-900/70">
              #{bookingId.slice(-8).toUpperCase()}
            </p>
          </div>
          <QRCodeSVG
            value={qrData}
            size={64}
            bgColor="transparent"
            fgColor="#253b1c"
            level="M"
            aria-label="Booking QR code"
          />
        </div>
      </div>

      {/* Download button */}
      <Button
        onClick={() => void handleDownload()}
        className="w-full max-w-sm bg-[#16a34a] text-white hover:bg-[#15803d]"
        size="sm"
      >
        <Download className="size-4" />
        Download ID as PNG
      </Button>
    </div>
  );
}
