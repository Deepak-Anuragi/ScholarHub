"use client";

import { useEffect, useState } from "react";
import { BookOpen, Check, GraduationCap, Loader2 } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { Button } from "@/components/ui/button";
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
  createdBy?: { name: string };
};

type EnrolledCourse = {
  _id: string;
  courseId: Course;
  completed: boolean;
};

const EXAM_TABS = ["All", "UPSC", "JEE", "NEET", "SSC", "Board"];

function CourseCard({
  course,
  isEnrolled,
  onEnroll,
  enrolling,
}: {
  course: Course;
  isEnrolled: boolean;
  onEnroll: (id: string) => void;
  enrolling: boolean;
}) {
  const size = course.fileSize
    ? course.fileSize > 1_048_576
      ? `${(course.fileSize / 1_048_576).toFixed(1)} MB`
      : `${Math.round(course.fileSize / 1024)} KB`
    : null;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
      {/* Thumbnail */}
      <div className="aspect-video w-full bg-gradient-to-br from-sage-100 via-sage-200 to-sand-100">
        {course.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap gap-1">
          {course.examTypes.map((t) => (
            <span
              key={t}
              className="rounded-full bg-[#16a34a]/10 px-2 py-0.5 text-[10px] font-semibold text-[#16a34a]"
            >
              {t}
            </span>
          ))}
        </div>
        <h3 className="mt-2 font-semibold text-forest-900 leading-snug">
          {course.title}
        </h3>
        {course.description && (
          <p className="mt-1 text-xs text-forest-900/60 line-clamp-2">
            {course.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-3 text-xs text-forest-900/50">
          <span>{course.enrolledCount} enrolled</span>
          {size && <span>· {size}</span>}
          {course.createdBy && <span>· {course.createdBy.name}</span>}
        </div>

        <div className="mt-auto pt-4">
          {isEnrolled ? (
            <div className="flex items-center gap-2 rounded-full bg-[#16a34a]/10 px-3 py-1.5 text-xs font-semibold text-[#16a34a]">
              <Check className="size-3.5" />
              Enrolled
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full bg-[#16a34a] text-white hover:bg-[#15803d]"
              disabled={enrolling}
              onClick={() => onEnroll(course._id)}
            >
              {enrolling ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <>
                  <GraduationCap className="size-3.5" />
                  Enroll Free
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const [tab, setTab] = useState("All");
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const examType = tab === "All" ? "all" : tab;
    Promise.all([
      fetch(`/api/courses?examType=${examType}`).then((r) => r.json()),
      fetch("/api/student/courses", { credentials: "include" }).then((r) =>
        r.json()
      ),
    ])
      .then(
        ([coursesData, enrolledData]: [
          { courses?: Course[] },
          { enrolled?: EnrolledCourse[] }
        ]) => {
          setCourses(coursesData.courses ?? []);
          const ids = new Set(
            (enrolledData.enrolled ?? []).map((e) => e.courseId._id)
          );
          setEnrolledIds(ids);
        }
      )
      .finally(() => setLoading(false));
  }, [tab]);

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setEnrolledIds((prev) => new Set([...prev, courseId]));
        setCourses((prev) =>
          prev.map((c) =>
            c._id === courseId
              ? { ...c, enrolledCount: c.enrolledCount + 1 }
              : c
          )
        );
      }
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
            Study Courses
          </h1>
          <p className="mt-1 text-sm text-forest-900/60">
            Free resources for competitive exam preparation
          </p>
        </div>
      </AnimatedContent>

      {/* Tabs */}
      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {EXAM_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition",
                tab === t
                  ? "bg-[#16a34a] text-white"
                  : "bg-white border border-line text-forest-900/70 hover:border-[#16a34a]/50"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </AnimatedContent>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="py-16 text-center">
          <BookOpen className="mx-auto size-8 text-forest-900/30" />
          <p className="mt-3 text-sm text-forest-900/50">
            No courses available for this category yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, i) => (
            <AnimatedContent
              key={course._id}
              distance={20}
              duration={0.4}
              threshold={0}
              delay={i * 0.04}
            >
              <CourseCard
                course={course}
                isEnrolled={enrolledIds.has(course._id)}
                onEnroll={(id) => void handleEnroll(id)}
                enrolling={enrollingId === course._id}
              />
            </AnimatedContent>
          ))}
        </div>
      )}
    </div>
  );
}
