"use client";

import { useEffect, useState } from "react";
import { BookOpen, Loader2, Plus, Trash2, X } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { Button } from "@/components/ui/button";

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

function AddCourseModal({
  onSave,
  onClose,
  saving,
}: {
  onSave: (data: Omit<Course, "_id" | "enrolledCount" | "createdBy" | "createdAt">) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    title: "", description: "", subject: "",
    examTypes: [] as string[], fileUrl: "",
  });

  const toggleExam = (t: string) =>
    setForm((p) => ({
      ...p,
      examTypes: p.examTypes.includes(t)
        ? p.examTypes.filter((e) => e !== t)
        : [...p.examTypes, t],
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-card bg-white p-6 shadow-lift" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-semibold text-forest-900">Add Course</p>
          <button type="button" onClick={onClose}><X className="size-4 text-forest-900/50" /></button>
        </div>
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
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Create Course"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/courses", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { courses?: Course[] }) => setCourses(d.courses ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (data: Omit<Course, "_id" | "enrolledCount" | "createdBy" | "createdAt">) => {
    setSaving(true);
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const d = (await res.json()) as { course?: Course };
    if (d.course) setCourses((p) => [d.course!, ...p]);
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    setDeleting(id);
    await fetch("/api/admin/courses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
    setCourses((p) => p.filter((c) => c._id !== id));
    setDeleting(null);
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
            <Button onClick={() => setShowModal(true)} className="bg-forest-900 text-white hover:bg-forest-700" size="sm">
              <Plus className="size-4" /> Add Course
            </Button>
          </div>
        </AnimatedContent>

        <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
          <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
            {loading ? (
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
                          <button type="button" onClick={() => void handleDelete(c._id)} disabled={deleting === c._id}
                            className="flex size-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition">
                            {deleting === c._id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                          </button>
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

      {showModal && (
        <AddCourseModal
          onSave={(d) => void handleCreate(d)}
          onClose={() => setShowModal(false)}
          saving={saving}
        />
      )}
    </>
  );
}
