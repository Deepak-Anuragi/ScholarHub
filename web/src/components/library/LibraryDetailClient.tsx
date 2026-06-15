"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Phone, Mail, MessageCircle, Star, Users, Sofa } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import SplitText from "@/components/SplitText";
import { BookingModal } from "@/components/booking/BookingModal";
import { Button } from "@/components/ui/button";
import { getFacilityIcon } from "@/lib/facility-icons";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Photo = {
  url: string;
  isCover: boolean;
  order: number;
};

type SlotData = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  totalSeats: number;
  availableSeats: number;
};

type ReviewData = {
  id: string;
  studentName?: string;
  studentId?: { name: string; avatarUrl?: string };
  rating: number;
  comment?: string;
  isVerified: boolean;
  date?: string;
  createdAt?: string;
};

type LibraryData = {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  totalSeats: number;
  availableSeats: number;
  monthlyFee: number;
  quarterlyFee?: number | null;
  annualFee?: number | null;
  facilities: string[];
  studentTypes: string[];
  photos: Photo[];
  ratingAvg: number;
  reviewCount: number;
  whatsapp?: string;
  contactEmail?: string;
  contactPhone?: string;
  // Mock-data compat
  rating?: number;
  fees?: { monthly: number; quarterly: number; annual: number };
};

type LibraryDetailClientProps = {
  library: LibraryData;
  initialSlots: SlotData[];
  initialReviews: ReviewData[];
  initialReviewTotal: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "size-5" : "size-3.5";
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            cls,
            i <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-forest-900/20"
          )}
        />
      ))}
    </span>
  );
}

// ─── Photo gallery ─────────────────────────────────────────────────────────

function PhotoGallery({ photos, libraryName }: { photos: Photo[]; libraryName: string }) {
  const sorted = [...photos].sort((a, b) => a.order - b.order);
  const cover = sorted.find((p) => p.isCover) ?? sorted[0];
  const [active, setActive] = useState<Photo | null>(cover ?? null);
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  const hasFallback = !active?.url;

  return (
    <>
      <div className="overflow-hidden rounded-card">
        {/* Main image */}
        <button
          type="button"
          onClick={() => active && setLightbox(active)}
          className="group relative block w-full overflow-hidden rounded-card"
          aria-label="Open full image"
        >
          {hasFallback ? (
            <div className="aspect-video w-full bg-gradient-to-br from-sage-100 via-sage-200 to-sand-100" />
          ) : (
            <div className="relative aspect-video w-full">
              <Image
                src={active!.url}
                alt={libraryName}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                priority
              />
              <div className="absolute inset-0 bg-transparent transition group-hover:bg-forest-900/10" />
            </div>
          )}
        </button>

        {/* Thumbnail strip */}
        {sorted.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {sorted.slice(0, 10).map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(photo)}
                className={cn(
                  "relative shrink-0 overflow-hidden rounded-xl transition-all",
                  active === photo
                    ? "ring-2 ring-[#16a34a] ring-offset-1"
                    : "opacity-60 hover:opacity-100"
                )}
              >
                {photo.url ? (
                  <div className="relative size-16">
                    <Image
                      src={photo.url}
                      alt={`Photo ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="size-16 bg-gradient-to-br from-sage-100 to-sage-200" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-forest-900/80 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
        >
          <div className="relative max-h-[90dvh] max-w-4xl w-full mx-4 overflow-hidden rounded-card">
            {lightbox.url ? (
              <Image
                src={lightbox.url}
                alt={libraryName}
                width={1200}
                height={800}
                className="w-full object-contain"
              />
            ) : (
              <div className="aspect-video bg-gradient-to-br from-sage-200 to-sand-100" />
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Rating breakdown bars ────────────────────────────────────────────────────

function RatingBars({ reviews }: { reviews: ReviewData[] }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="space-y-1.5">
      {counts.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2 text-xs text-forest-900/70">
          <span className="w-3 text-right">{star}</span>
          <Star className="size-3 fill-amber-400 text-amber-400" />
          <div className="flex-1 overflow-hidden rounded-full bg-sage-100">
            <div
              className="h-2 rounded-full bg-[#16a34a] transition-all duration-700"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="w-4 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export function LibraryDetailClient({
  library,
  initialSlots,
  initialReviews,
  initialReviewTotal,
}: LibraryDetailClientProps) {
  const [showModal, setShowModal] = useState(false);
  const [reviews, setReviews] = useState<ReviewData[]>(initialReviews);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotal] = useState(initialReviewTotal);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const ratingAvg = library.ratingAvg ?? library.rating ?? 0;
  const monthlyFee = library.monthlyFee;
  const quarterlyFee = library.quarterlyFee ?? library.fees?.quarterly;
  const annualFee = library.annualFee ?? library.fees?.annual;
  const allSeatsFull = library.availableSeats <= 0;
  const mapsUrl = library.lat && library.lng
    ? `https://www.google.com/maps?q=${library.lat},${library.lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(library.address + " " + library.city)}`;

  const loadMoreReviews = async () => {
    setLoadingReviews(true);
    const nextPage = reviewPage + 1;
    try {
      const res = await fetch(
        `/api/libraries/${library.id}/reviews?page=${nextPage}&limit=5`
      );
      const data = (await res.json()) as { reviews: ReviewData[] };
      setReviews((prev) => [...prev, ...data.reviews]);
      setReviewPage(nextPage);
    } finally {
      setLoadingReviews(false);
    }
  };

  const hasMoreReviews = reviews.length < reviewTotal;

  const studentTypeColors: Record<string, string> = {
    "Govt Exam": "bg-blue-50 text-blue-700 border-blue-200",
    "Entrance Exam": "bg-purple-50 text-purple-700 border-purple-200",
    School: "bg-amber-50 text-amber-700 border-amber-200",
    Professional: "bg-forest-700/10 text-forest-700 border-forest-700/20",
  };

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Photo gallery */}
          <AnimatedContent distance={20} duration={0.5} threshold={0}>
            <PhotoGallery
              photos={library.photos}
              libraryName={library.name}
            />
          </AnimatedContent>

          {/* Name + meta */}
          <AnimatedContent distance={24} duration={0.55} threshold={0} delay={0.05}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/50">
                {library.city}, {library.state}
              </p>

              <SplitText
                text={library.name}
                tag="h1"
                className="font-display text-4xl text-forest-900 sm:text-5xl"
                delay={55}
                from={{ opacity: 0, y: 30 }}
                to={{ opacity: 1, y: 0 }}
                textAlign="left"
              />

              {/* Rating row */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16a34a] px-3 py-1 text-sm font-bold text-white">
                  <Star className="size-3.5 fill-white text-white" />
                  {ratingAvg.toFixed(1)}
                </span>
                <StarRating rating={ratingAvg} />
                <a
                  href="#reviews"
                  className="text-sm text-forest-900/60 underline-offset-2 hover:underline"
                >
                  {library.reviewCount} reviews
                </a>
                <span className="text-sm text-forest-900/60">·</span>
                <span className="text-sm font-semibold text-[#16a34a]">
                  From ₹{monthlyFee.toLocaleString("en-IN")}/mo
                </span>
              </div>

              {/* Address */}
              <div className="mt-3 flex items-start gap-2 text-sm text-forest-900/70">
                <MapPin className="mt-0.5 size-4 shrink-0 text-forest-700" />
                <span>
                  {library.address}, {library.district} – {library.pincode}
                  {" · "}
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#16a34a] hover:underline"
                  >
                    Get Directions
                  </a>
                </span>
              </div>
            </div>
          </AnimatedContent>

          {/* About */}
          {library.description && (
            <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.1}>
              <div className="rounded-card border border-line bg-white/80 p-5 shadow-soft">
                <p className="text-sm font-semibold text-forest-900">About this Library</p>
                <p className="mt-3 text-sm leading-relaxed text-forest-900/70">
                  {library.description}
                </p>
              </div>
            </AnimatedContent>
          )}

          {/* Seat stats */}
          <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.12}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Sofa, label: "Total Seats", value: library.totalSeats },
                {
                  icon: Users,
                  label: "Available",
                  value: library.availableSeats,
                  highlight: library.availableSeats > 0,
                },
                {
                  icon: Users,
                  label: "Occupancy",
                  value: `${Math.round(((library.totalSeats - library.availableSeats) / Math.max(library.totalSeats, 1)) * 100)}%`,
                },
              ].map(({ icon: Icon, label, value, highlight }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-line bg-white/80 p-4 text-center"
                >
                  <Icon className="mx-auto size-5 text-[#16a34a]" />
                  <p
                    className={cn(
                      "mt-1 text-xl font-bold",
                      highlight ? "text-[#16a34a]" : "text-forest-900"
                    )}
                  >
                    {value}
                  </p>
                  <p className="text-xs text-forest-900/50">{label}</p>
                </div>
              ))}
            </div>
          </AnimatedContent>

          {/* Facilities */}
          <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.14}>
            <div className="rounded-card border border-line bg-white/80 p-5 shadow-soft">
              <p className="text-sm font-semibold text-forest-900">Facilities</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {library.facilities.map((f) => {
                  const Icon = getFacilityIcon(f);
                  return (
                    <div
                      key={f}
                      className="flex items-center gap-2.5 rounded-2xl border border-line bg-sage-100/40 px-3 py-2.5"
                    >
                      <Icon className="size-4 shrink-0 text-[#16a34a]" aria-hidden />
                      <span className="text-sm text-forest-900">{f}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </AnimatedContent>

          {/* Student types */}
          <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.16}>
            <div className="rounded-card border border-line bg-white/80 p-5 shadow-soft">
              <p className="text-sm font-semibold text-forest-900">For Students</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {library.studentTypes.map((t) => (
                  <span
                    key={t}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm font-medium",
                      studentTypeColors[t] ?? "bg-sage-100 text-forest-900 border-line"
                    )}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </AnimatedContent>

          {/* Contact */}
          {(library.contactPhone || library.whatsapp || library.contactEmail) && (
            <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.18}>
              <div className="rounded-card border border-line bg-white/80 p-5 shadow-soft">
                <p className="text-sm font-semibold text-forest-900">Contact</p>
                <div className="mt-3 space-y-2">
                  {library.contactPhone && (
                    <a
                      href={`tel:${library.contactPhone}`}
                      className="flex items-center gap-2 text-sm text-forest-900/70 hover:text-forest-900"
                    >
                      <Phone className="size-4 text-[#16a34a]" />
                      {library.contactPhone}
                    </a>
                  )}
                  {library.whatsapp && (
                    <a
                      href={`https://wa.me/${library.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-forest-900/70 hover:text-forest-900"
                    >
                      <MessageCircle className="size-4 text-[#16a34a]" />
                      WhatsApp
                    </a>
                  )}
                  {library.contactEmail && (
                    <a
                      href={`mailto:${library.contactEmail}`}
                      className="flex items-center gap-2 text-sm text-forest-900/70 hover:text-forest-900"
                    >
                      <Mail className="size-4 text-[#16a34a]" />
                      {library.contactEmail}
                    </a>
                  )}
                </div>
              </div>
            </AnimatedContent>
          )}

          {/* Map */}
          {library.lat && library.lng ? (
            <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.2}>
              <div className="rounded-card border border-line bg-white/80 p-5 shadow-soft">
                <p className="mb-3 text-sm font-semibold text-forest-900">Location</p>
                <div className="overflow-hidden rounded-2xl">
                  <iframe
                    title="Library location map"
                    width="100%"
                    height="240"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${library.lat},${library.lng}&z=15&output=embed`}
                    className="border-0"
                  />
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#16a34a] hover:underline"
                >
                  <MapPin className="size-4" />
                  Open in Google Maps
                </a>
              </div>
            </AnimatedContent>
          ) : null}

          {/* Slot availability */}
          {initialSlots.length > 0 && (
            <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.22}>
              <div className="rounded-card border border-line bg-white/80 p-5 shadow-soft">
                <p className="mb-4 text-sm font-semibold text-forest-900">
                  Seat Availability by Slot
                </p>
                <div className="space-y-3">
                  {initialSlots.map((slot) => {
                    const pct = Math.round(
                      (slot.availableSeats / Math.max(slot.totalSeats, 1)) * 100
                    );
                    return (
                      <div
                        key={slot.id}
                        className="rounded-2xl border border-line bg-white p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-forest-900">
                              {slot.name}
                            </p>
                            <p className="text-xs text-forest-900/60">
                              {slot.startTime} – {slot.endTime}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                              slot.availableSeats <= 0
                                ? "bg-red-100 text-red-600"
                                : slot.availableSeats <= 5
                                ? "bg-amber-100 text-amber-700"
                                : "bg-sage-100 text-forest-900"
                            )}
                          >
                            {slot.availableSeats}/{slot.totalSeats}
                          </span>
                        </div>
                        <div className="mt-3 h-1.5 rounded-full bg-sage-100">
                          <div
                            className="h-1.5 rounded-full bg-[#16a34a] transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </AnimatedContent>
          )}
        </div>

        {/* ── Right column — sticky booking card ─────────────────────────── */}
        <aside>
          <div className="sticky top-[calc(var(--header-height)+1.5rem)]">
            <AnimatedContent
              distance={30}
              direction="horizontal"
              reverse
              duration={0.55}
              threshold={0}
              delay={0.1}
            >
              <div className="rounded-card border border-line bg-white shadow-lift p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-forest-900/50">
                  Book a Seat
                </p>
                <p className="mt-1 font-display text-2xl text-forest-900">
                  ₹{monthlyFee.toLocaleString("en-IN")}
                  <span className="text-base font-normal text-forest-900/50">/mo</span>
                </p>

                {/* Fee table */}
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-forest-900/50">
                      <th className="pb-2 font-semibold">Plan</th>
                      <th className="pb-2 font-semibold">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Monthly", fee: monthlyFee },
                      ...(quarterlyFee ? [{ label: "Quarterly", fee: quarterlyFee }] : []),
                      ...(annualFee ? [{ label: "Annual", fee: annualFee }] : []),
                    ].map(({ label, fee }) => (
                      <tr key={label} className="border-b border-line last:border-0">
                        <td className="py-2 text-forest-900/70">{label}</td>
                        <td className="py-2 font-semibold text-forest-900">
                          ₹{fee.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Slot quick view */}
                {initialSlots.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {initialSlots.slice(0, 3).map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between rounded-xl bg-sage-100/60 px-3 py-2 text-xs"
                      >
                        <span className="font-medium text-forest-900">
                          {slot.name} · {slot.startTime}–{slot.endTime}
                        </span>
                        <span
                          className={cn(
                            "font-semibold",
                            slot.availableSeats <= 0
                              ? "text-red-500"
                              : slot.availableSeats <= 5
                              ? "text-amber-600"
                              : "text-[#16a34a]"
                          )}
                        >
                          {slot.availableSeats <= 0
                            ? "Full"
                            : `${slot.availableSeats} left`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-5 space-y-2">
                  {allSeatsFull ? (
                    <Button
                      className="w-full bg-forest-900 text-sand-100 hover:bg-forest-900/90"
                      onClick={() => setShowModal(true)}
                    >
                      Join Waitlist
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-[#16a34a] text-white hover:bg-[#15803d]"
                      onClick={() => setShowModal(true)}
                    >
                      Book Now
                    </Button>
                  )}
                </div>

                <p className="mt-3 text-center text-xs text-forest-900/40">
                  Book online in 2 minutes · Instant confirmation
                </p>
              </div>
            </AnimatedContent>
          </div>
        </aside>
      </div>

      {/* ── Reviews section ──────────────────────────────────────────────── */}
      <section className="mt-12" id="reviews">
        <AnimatedContent distance={20} duration={0.5} threshold={0.05}>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl text-forest-900">
                Student Reviews
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <StarRating rating={ratingAvg} size="lg" />
                <span className="text-2xl font-bold text-forest-900">
                  {ratingAvg.toFixed(1)}
                </span>
                <span className="text-sm text-forest-900/50">
                  ({library.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>
        </AnimatedContent>

        {reviews.length > 0 && (
          <AnimatedContent distance={20} duration={0.5} threshold={0.05} delay={0.05}>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-1">
                <RatingBars reviews={reviews} />
              </div>
            </div>
          </AnimatedContent>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {reviews.map((review, i) => {
            const name =
              typeof review.studentId === "object"
                ? review.studentId?.name
                : review.studentName ?? "Student";
            const dateStr = review.createdAt ?? review.date ?? "";

            return (
              <AnimatedContent
                key={review.id ?? i}
                distance={20}
                duration={0.45}
                threshold={0.05}
                delay={i * 0.05}
              >
                <div className="rounded-2xl border border-line bg-white/80 p-5">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#16a34a]/15 text-sm font-bold text-[#16a34a]">
                      {getInitials(name ?? "S")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-forest-900 truncate">
                          {name}
                        </p>
                        <StarRating rating={review.rating} />
                      </div>
                      {dateStr && (
                        <p className="text-xs text-forest-900/50">{fmtDate(dateStr)}</p>
                      )}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="mt-3 text-sm leading-relaxed text-forest-900/70">
                      {review.comment}
                    </p>
                  )}
                  {review.isVerified && (
                    <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#16a34a]/10 px-2.5 py-0.5 text-xs font-semibold text-[#16a34a]">
                      ✓ Verified Student
                    </span>
                  )}
                </div>
              </AnimatedContent>
            );
          })}
        </div>

        {hasMoreReviews && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => void loadMoreReviews()}
              disabled={loadingReviews}
            >
              {loadingReviews ? "Loading..." : "Load more reviews"}
            </Button>
          </div>
        )}
      </section>

      {/* Booking modal */}
      {showModal && (
        <BookingModal
          libraryId={library.id}
          libraryName={library.name}
          fees={{
            monthlyFee,
            quarterlyFee,
            annualFee,
          }}
          slots={initialSlots}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
