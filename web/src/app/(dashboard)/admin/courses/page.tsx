"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { DataError } from "@/components/dashboard/DataError";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Course = {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  examTypes: string[];
  fileUrl: string;
  enrolledCount: number;
  createdBy?: { name: string };
  createdAt: string;
};

const EXAM_OPTS = ["UPSC","SSC","JEE","NEET","Board","Professional"];

type CourseInput = Omit<Course, "_id" | "enrolledCount" | "createdBy" | "createdAt">;

function CourseModal({
  course,
  onSave,
  onClose,
  saving,
}: {
  /** Absent when creating; the course being edited otherwise. */
  course?: Course;
  onSave: (data: CourseInput) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const editing = course !== undefined;
  const [form, setForm] = useState({
    title: course?.title ?? "",
    description: course?.description ?? "",
    subject: course?.subject ?? "",
    examTypes: (course?.examTypes ?? []) as string[],
    fileUrl: course?.fileUrl ?? "",
  });

  const toggleExam = (t: string) =>
    setForm((p) => ({
      ...p,
      examTypes: p.examTypes.includes(t)
        ? p.examTypes.filter((e) => e !== t)
        : [...p.examTypes, t],
    }));

  return (
    <Modal
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={editing ? "Edit Course" : "Add Course"}
    >
      <div className="space-y-3">
          {(["title","subject","fileUrl"] as const).map((key) => (
            <label key={key} className="grid gap-1.5 text-sm font-semibold capitalize text-forest-900">
              {key === "fileUrl" ? "File URL" : key.charAt(0).toUpperCase() + key.slice(1)}
              <input
                type="text"
                value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm outline-none transition focus:border-forest-900"
              />
            </label>
          ))}
          <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="rounded-xl border border-line bg-sage-100/40 px-3 py-2 text-sm outline-none transition focus:border-forest-900 resize-none"
            />
          </label>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-forest-900">Exam Types</p>
            <div className="flex flex-wrap gap-2">
              {EXAM_OPTS.map((t) => (
                <button key={t} type="button" onClick={() => toggleExam(t)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    form.examTypes.includes(t)
                      ? "border-forest-900 bg-forest-900 text-white"
                      : "border-line text-forest-900/60 hover:border-forest-900/40"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
      </div>
      <Button
        onClick={() => onSave(form)}
        disabled={saving || !form.title || !form.subject || !form.fileUrl}
        className="mt-5 w-full bg-forest-900 text-white hover:bg-forest-700"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : editing ? "Save Changes" : "Create Course"}
      </Button>
    </Modal>
  );
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  /** null = closed, "new" = create, otherwise the id being edited. */
  const [modal, setModal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<{ courses?: Course[] }>("/admin/courses")
      .then((d) => setCourses(d.courses ?? []))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Something went wrong.")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (data: CourseInput) => {
    const editingId = modal !== "new" ? modal : null;
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const d = await api.patch<{ course?: Course }>(`/admin/courses/${editingId}`, data);
        if (d.course) setCourses((p) => p.map((c) => (c._id === editingId ? d.course! : c)));
      } else {
        const d = await api.post<{ course?: Course }>("/admin/courses", data);
        if (d.course) setCourses((p) => [d.course!, ...p]);
      }
      setModal(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Could not ${editingId ? "update" : "create"} the course.`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (course: Course) => {
    // Enrolments are deleted with the course, so say so before doing it.
    const enrolled = course.enrolledCount;
    const warning = enrolled > 0
      ? `${enrolled} student${enrolled === 1 ? " is" : "s are"} enrolled in "${course.title}". Deleting it removes their enrolment too. Continue?`
      : "Delete this course?";
    if (!confirm(warning)) return;

    setDeleting(course._id);
    setError(null);
    try {
      await api.delete(`/admin/courses/${course._id}${enrolled > 0 ? "?cascade=true" : ""}`);
      setCourses((p) => p.filter((c) => c._id !== course._id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the course.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <AnimatedContent distance={20} duration={0.45} threshold={0}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">Study Courses</h1>
              <p className="mt-1 text-sm text-forest-900/60">{courses.length} courses on the platform</p>
            </div>
            <Button onClick={() => setModal("new")} className="bg-forest-900 text-white hover:bg-forest-700" size="sm">
              <Plus className="size-4" /> Add Course
            </Button>
          </div>
        </AnimatedContent>

        <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
          <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
            {error ? (
              <DataError message={error} onRetry={load} />
            ) : loading ? (
              <div className="flex h-52 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-forest-900/40" />
              </div>
            ) : courses.length === 0 ? (
              <div className="py-16 text-center">
                <BookOpen className="mx-auto size-8 text-forest-900/20" />
                <p className="mt-3 text-sm text-forest-900/50">No courses yet. Add the first one.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-sage-100/50 text-left text-xs font-semibold uppercase tracking-wide text-forest-900/40">
                      {["Title","Subject","Exam Types","Enrolled","Created By","Date",""].map((h) => (
                        <th key={h} className="px-4 py-2.5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((c) => (
                      <tr key={c._id} className="border-b border-line last:border-0 hover:bg-sage-100/20">
                        <td className="px-4 py-3 font-medium text-forest-900 max-w-[200px] truncate">{c.title}</td>
                        <td className="px-4 py-3 text-forest-900/70">{c.subject}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {c.examTypes.map((t) => (
                              <span key={t} className="rounded-full bg-forest-900/10 px-2 py-0.5 text-[10px] font-semibold text-forest-900">{t}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-forest-900/70">{c.enrolledCount}</td>
                        <td className="px-4 py-3 text-forest-900/60">{c.createdBy?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-forest-900/50 whitespace-nowrap">
                          {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => setModal(c._id)} aria-label={`Edit ${c.title}`}
                              className="flex size-7 items-center justify-center rounded-lg text-forest-900/60 hover:bg-sage-100 hover:text-forest-900 transition">
                              <Pencil className="size-3.5" />
                            </button>
                            <button type="button" onClick={() => void handleDelete(c)} disabled={deleting === c._id}
                              aria-label={`Delete ${c.title}`}
                              className="flex size-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition">
                              {deleting === c._id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </AnimatedContent>
      </div>

      {modal && (
        <CourseModal
          course={courses.find((c) => c._id === modal)}
          onSave={(d) => void handleSave(d)}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
    </>
  );
}
