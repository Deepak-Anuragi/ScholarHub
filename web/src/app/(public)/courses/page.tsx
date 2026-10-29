"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle,
  Download,
  ExternalLink,
  GraduationCap,
  Loader2,
  Lock,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Course = {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  examTypes: string[];
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize?: number;
  enrolledCount: number;
  isTopRated?: boolean;
  createdBy?: { name: string };
};

const EXAM_PRESETS = [
  "All",
  "UPSC",
  "JEE",
  "NEET",
  "SSC",
  "BANKING",
  "STATE_PSC",
  "GATE",
  "DEFENCE",
  "BOARD",
];

export default function PublicCoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const [selectedExam, setSelectedExam] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const d = await api.get<{ courses?: Course[] }>("/courses");
        setCourses(d.courses ?? []);
      } catch {
        setCourses([]);
      }

      // If logged in as student, fetch enrolled course IDs
      if (isAuthenticated) {
        try {
          const res = await api.get<{ enrolled?: Array<{ courseId: { _id: string } | string }> }>(
            "/student/courses"
          );
          const ids = new Set(
            (res.enrolled ?? []).map((e) =>
              typeof e.courseId === "string" ? e.courseId : e.courseId?._id
            )
          );
          setEnrolledIds(ids);
        } catch {
          /* ignore */
        }
      }
      setLoading(false);
    }

    void loadData();
  }, [isAuthenticated]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchExam =
        selectedExam === "All" ||
        (c.examTypes &&
          c.examTypes.some(
            (t) => t.toUpperCase() === selectedExam.toUpperCase()
          ));
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q));
      return matchExam && matchQuery;
    });
  }, [courses, selectedExam, searchQuery]);

  const handleEnrollOrAccess = async (course: Course) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/courses`);
      return;
    }

    if (enrolledIds.has(course._id)) {
      if (course.fileUrl) {
        window.open(course.fileUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }

    setEnrollingId(course._id);
    try {
      await api.post(`/courses/${course._id}/enroll`, {});
      setEnrolledIds((prev) => new Set([...prev, course._id]));
      setCourses((prev) =>
        prev.map((c) =>
          c._id === course._id ? { ...c, enrolledCount: c.enrolledCount + 1 } : c
        )
      );
      if (course.fileUrl) {
        window.open(course.fileUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to enroll.");
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-sand-100/60 pb-20 pt-8 sm:pt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Hero */}
        <AnimatedContent distance={25} duration={0.5} threshold={0}>
          <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-white via-sage-100/30 to-sand-100 p-8 shadow-soft sm:p-12">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-forest-700/20 bg-forest-700/10 px-3.5 py-1 text-xs font-semibold text-forest-700">
                <Sparkles className="size-3.5" />
                Curated Preparation Notes &amp; Courses
              </div>
              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-forest-900 sm:text-5xl">
                Master Your Exam with Verified Study Resources
              </h1>
              <p className="mt-3 text-base leading-relaxed text-forest-900/70 sm:text-lg">
                Exclusive handwritten notes, formula sheets, and curated test series
                uploaded by subject mentors. Free access for all Scholar&apos;s Hub members.
              </p>

              {/* Search input */}
              <div className="mt-6 flex max-w-xl items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-forest-900/40" />
                  <Input
                    placeholder="Search by topic, subject, or exam (e.g. Physics, UPSC, JEE)…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 rounded-full pl-10 pr-4 text-sm shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-forest-900/40 hover:text-forest-900"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -bottom-12 -right-12 size-72 rounded-full bg-forest-700/5 blur-3xl" />
          </div>
        </AnimatedContent>

        {/* Exam Type Filter Pills */}
        <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.08}>
          <div className="mt-8 flex flex-wrap items-center gap-2 pb-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-forest-900/50">
              Exam:
            </span>
            {EXAM_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setSelectedExam(preset)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200",
                  selectedExam.toUpperCase() === preset.toUpperCase()
                    ? "bg-forest-700 text-white shadow-xs"
                    : "border border-line bg-white/80 text-forest-900/70 hover:border-forest-700/40 hover:bg-white hover:text-forest-900"
                )}
              >
                {preset === "All" ? "All Exams" : preset.replace("_", " ")}
              </button>
            ))}
          </div>
        </AnimatedContent>

        {/* Course Cards Grid */}
        <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.12}>
          <div className="mt-6">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-72 animate-pulse rounded-2xl border border-line bg-white/70 p-5 shadow-xs"
                  />
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="rounded-2xl border border-line bg-white/80 py-16 text-center shadow-soft">
                <BookOpen className="mx-auto size-12 text-forest-900/30" />
                <h3 className="mt-3 font-display text-xl font-semibold text-forest-900">
                  No courses found
                </h3>
                <p className="mt-1 text-sm text-forest-900/60">
                  Try adjusting your search query or selecting another exam track.
                </p>
                {(searchQuery || selectedExam !== "All") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedExam("All");
                    }}
                    className="mt-4 rounded-full"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((course) => {
                  const isEnrolled = enrolledIds.has(course._id);
                  const isEnrolling = enrollingId === course._id;

                  return (
                    <article
                      key={course._id}
                      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-forest-700/30 hover:shadow-lg"
                    >
                      <div>
                        {/* Tags */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            {course.examTypes?.slice(0, 2).map((t) => (
                              <Badge
                                key={t}
                                variant="secondary"
                                className="bg-emerald-50 text-[10px] font-bold text-emerald-800"
                              >
                                {t}
                              </Badge>
                            ))}
                            {course.subject && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-medium text-forest-900/70"
                              >
                                {course.subject}
                              </Badge>
                            )}
                          </div>
                          {course.isTopRated && (
                            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                              <Sparkles className="size-2.5" /> Top Rated
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <h3 className="mt-3 font-display text-lg font-bold text-forest-900 transition-colors group-hover:text-forest-700">
                          {course.title}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-forest-900/65 line-clamp-3">
                          {course.description || "Comprehensive notes and reference guide verified by Scholar's Hub."}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-5 border-t border-line/80 pt-4">
                        <div className="mb-3.5 flex items-center justify-between text-xs text-forest-900/55">
                          <span className="flex items-center gap-1 font-medium">
                            <Users className="size-3.5" />
                            {course.enrolledCount} {course.enrolledCount === 1 ? "student" : "students"}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-emerald-700">
                            <GraduationCap className="size-3.5" /> Free Access
                          </span>
                        </div>

                        <Button
                          onClick={() => void handleEnrollOrAccess(course)}
                          disabled={isEnrolling}
                          className={cn(
                            "w-full rounded-xl text-xs font-semibold transition-all duration-200",
                            isEnrolled
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-forest-700 text-white hover:bg-forest-800"
                          )}
                        >
                          {isEnrolling ? (
                            <>
                              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                              Enrolling…
                            </>
                          ) : isEnrolled ? (
                            <>
                              <ExternalLink className="mr-1.5 size-3.5" />
                              Open Notes &amp; Materials
                            </>
                          ) : !isAuthenticated ? (
                            <>
                              <Lock className="mr-1.5 size-3.5" />
                              Sign In to Enroll (Free)
                            </>
                          ) : (
                            <>
                              <Download className="mr-1.5 size-3.5" />
                              Enroll &amp; Access Notes
                            </>
                          )}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </AnimatedContent>

        {/* Bottom CTA to find library seats */}
        <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.15}>
          <div className="mt-14 flex flex-col items-center justify-between gap-4 rounded-2xl border border-line bg-white p-6 shadow-soft sm:flex-row sm:p-8">
            <div>
              <h3 className="font-display text-xl font-bold text-forest-900">
                Need a silent, disciplined space to study?
              </h3>
              <p className="mt-1 text-sm text-forest-900/65">
                Reserve your personal reading seat at a verified partner library in your city.
              </p>
            </div>
            <Link
              href="/libraries"
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-forest-700 px-6 text-sm font-semibold text-white shadow-xs transition hover:bg-forest-800"
            >
              Explore Study Libraries →
            </Link>
          </div>
        </AnimatedContent>
      </div>
    </main>
  );
}
