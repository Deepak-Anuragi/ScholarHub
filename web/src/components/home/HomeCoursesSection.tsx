"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Users, Star, ArrowRight, Loader2, Check, BookOpen } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";

type Course = {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  examTypes: string[];
  fileUrl: string;
  enrolledCount: number;
  isTopRated?: boolean;
  createdBy?: { name: string };
};

const EXAM_FILTERS = ["all", "UPSC", "JEE", "NEET", "SSC", "Board", "Professional"];

export function HomeCoursesSection() {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState("all");
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrolledMap, setEnrolledMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    const param = selectedExam !== "all" ? `&examType=${encodeURIComponent(selectedExam)}` : "";
    api
      .get<{ courses?: Course[] }>(`/courses?topRated=true${param}`)
      .then((res) => {
        setCourses(res.courses ?? []);
      })
      .catch(() => {
        setCourses([]);
      })
      .finally(() => setLoading(false));
  }, [selectedExam]);

  const handleEnroll = async (courseId: string) => {
    // If not logged in, redirect to login page with callback
    if (!user) {
      router.push(`/auth/login?redirect=/student/courses`);
      return;
    }

    setEnrollingId(courseId);
    try {
      await api.post(`/courses/${courseId}/enroll`, {});
      setEnrolledMap((prev) => ({ ...prev, [courseId]: true }));
      setCourses((prev) =>
        prev.map((c) => (c._id === courseId ? { ...c, enrolledCount: c.enrolledCount + 1 } : c))
      );
    } catch {
      // If already enrolled, still mark as enrolled
      setEnrolledMap((prev) => ({ ...prev, [courseId]: true }));
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <section id="courses" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-forest-900/10 px-3 py-1 text-xs font-semibold text-forest-900 mb-2 dark:bg-white/10 dark:text-white">
            <Star className="size-3.5 fill-amber-500 text-amber-500" />
            Top-Rated & Admin Verified
          </div>
          <h2 className="font-display text-3xl text-forest-900 sm:text-4xl dark:text-white">
            Featured Study Courses & Notes
          </h2>
          <p className="mt-1 text-sm text-forest-900/60 dark:text-zinc-400">
            Exclusive curated exam prep materials uploaded by administrators. Free to enroll.
          </p>
        </div>

        {user ? (
          <Link
            href="/student/courses"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-white/70 px-5 text-sm font-semibold text-forest-900 transition hover:border-[#16a34a] hover:text-[#16a34a] dark:bg-[#27272a] dark:border-[#3f3f46] dark:text-white"
          >
            My Enrolled Courses →
          </Link>
        ) : (
          <Link
            href="/auth/signup/student"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#16a34a] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
          >
            Create Free Account →
          </Link>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {EXAM_FILTERS.map((exam) => (
          <button
            key={exam}
            type="button"
            onClick={() => setSelectedExam(exam)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              selectedExam === exam
                ? "bg-forest-900 text-white shadow-sm dark:bg-white dark:text-black"
                : "border border-line bg-white/80 text-forest-900/70 hover:border-forest-900 hover:text-forest-900 dark:bg-[#27272a] dark:border-[#3f3f46] dark:text-zinc-300"
            }`}
          >
            {exam === "all" ? "All Exams" : exam}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 flex h-48 items-center justify-center rounded-card border border-line bg-white/50">
          <Loader2 className="size-6 animate-spin text-forest-900/40" />
        </div>
      ) : courses.length === 0 ? (
        <div className="mt-8 rounded-card border border-line bg-white/80 p-12 text-center shadow-soft dark:bg-[#18181b] dark:border-[#27272a]">
          <BookOpen className="mx-auto size-10 text-forest-900/30" />
          <p className="mt-3 text-base font-semibold text-forest-900 dark:text-white">No courses available for this category</p>
          <p className="mt-1 text-sm text-forest-900/60 dark:text-zinc-400">
            Our academic administrators add new verified course notes weekly.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const isEnrolled = Boolean(enrolledMap[course._id]);
            const isBusy = enrollingId === course._id;

            return (
              <div
                key={course._id}
                className="group flex flex-col justify-between overflow-hidden rounded-card border border-line bg-white/85 p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift dark:bg-[#18181b] dark:border-[#27272a]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full bg-forest-900/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-forest-900 dark:bg-white/10 dark:text-white">
                      {course.subject}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-forest-900/60 dark:text-zinc-400">
                      <Users className="size-3.5" />
                      {course.enrolledCount} enrolled
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-lg font-bold text-forest-900 line-clamp-1 group-hover:text-[#16a34a] transition dark:text-white">
                    {course.title}
                  </h3>

                  {course.description && (
                    <p className="mt-1.5 text-xs leading-relaxed text-forest-900/70 line-clamp-2 dark:text-zinc-300">
                      {course.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1">
                    {course.examTypes.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-line bg-sage-100/50 px-2 py-0.5 text-[10px] font-medium text-forest-900/80 dark:bg-[#27272a] dark:text-zinc-300 dark:border-[#3f3f46]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-line pt-4 dark:border-[#27272a]">
                  {isEnrolled ? (
                    <Link
                      href="/student/courses"
                      className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-[#16a34a]/15 text-xs font-bold text-[#16a34a] transition hover:bg-[#16a34a]/25"
                    >
                      <Check className="size-4" /> Enrolled (Open in Dashboard)
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleEnroll(course._id)}
                      disabled={isBusy}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-forest-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-forest-700 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    >
                      {isBusy ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" /> Enrolling...
                        </>
                      ) : (
                        <>
                          <GraduationCap className="size-4" />
                          {user ? "Enroll Free" : "Sign In & Enroll"}
                          <ArrowRight className="size-3" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

