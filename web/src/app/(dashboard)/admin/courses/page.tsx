"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Star,
  AlertCircle,
  Upload,
  Link as LinkIcon,
  FileText,
} from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { DataError } from "@/components/dashboard/DataError";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

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
  createdAt: string;
};

const EXAM_OPTS = [
  "UPSC",
  "JEE",
  "NEET",
  "SSC",
  "Banking",
  "Board",
  "Entrance Exam",
  "Professional",
  "Other",
];

type CourseInput = Omit<Course, "_id" | "enrolledCount" | "createdBy" | "createdAt"> & {
  fileSize?: number;
};

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

  // Form states
  const [examType, setExamType] = useState<string>(course?.examTypes?.[0] ?? "");
  const [title, setTitle] = useState<string>(course?.title ?? "");
  const [subject, setSubject] = useState<string>(course?.subject ?? "");
  const [description, setDescription] = useState<string>(course?.description ?? "");
  const [fileSource, setFileSource] = useState<"url" | "upload">(
    course?.fileUrl?.startsWith("data:") ? "upload" : "url"
  );
  const [fileUrl, setFileUrl] = useState<string>(course?.fileUrl ?? "");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadedFileSize, setUploadedFileSize] = useState<number | undefined>(undefined);

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setUploadedFileSize(file.size);

    setErrors((prev) => {
      const next = { ...prev };
      delete next.fileUrl;
      return next;
    });

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFileUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const newErrors: Record<string, string> = {};
    const missingFields: string[] = [];

    if (!examType.trim()) {
      newErrors.examType = "Please select an Exam Type.";
      missingFields.push("Exam Type");
    }
    if (!title.trim()) {
      newErrors.title = "Please enter the Course Title.";
      missingFields.push("Title");
    }
    if (!subject.trim()) {
      newErrors.subject = "Please enter the Subject.";
      missingFields.push("Subject");
    }
    if (!fileUrl.trim()) {
      newErrors.fileUrl =
        fileSource === "upload"
          ? "Please choose a PDF or Notes file to upload."
          : "Please enter a File URL or Google Drive link.";
      missingFields.push(fileSource === "upload" ? "PDF/Notes File" : "File URL");
    }

    if (missingFields.length > 0) {
      setErrors(newErrors);
      setTopError(`Please fill in the required field(s): ${missingFields.join(", ")}`);
      return;
    }

    setErrors({});
    setTopError(null);

    onSave({
      title: title.trim(),
      subject: subject.trim(),
      description: description.trim(),
      examTypes: [examType.trim()],
      fileUrl: fileUrl.trim(),
      fileSize: uploadedFileSize,
    });
  };

  return (
    <Modal
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={editing ? "Edit Course" : "Add Course"}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Error notification banner if required fields are missing */}
        {topError && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1">{topError}</div>
          </div>
        )}

        {/* 1. Exam Type (Dropdown first as requested) */}
        <div className="grid gap-1.5">
          <label className="text-xs font-semibold text-forest-900 dark:text-zinc-200">
            Exam Type <span className="text-red-500 font-bold">*</span>
          </label>
          <select
            value={examType}
            onChange={(e) => {
              setExamType(e.target.value);
              if (errors.examType) {
                setErrors((p) => {
                  const n = { ...p };
                  delete n.examType;
                  return n;
                });
              }
            }}
            className={cn(
              "h-10 rounded-xl border bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-900 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]",
              errors.examType ? "border-red-500 bg-red-50/20" : "border-line"
            )}
          >
            <option value="">-- Select Exam Type --</option>
            {EXAM_OPTS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errors.examType && <p className="text-xs text-red-500">{errors.examType}</p>}
        </div>

        {/* 2. Course Title */}
        <div className="grid gap-1.5">
          <label className="text-xs font-semibold text-forest-900 dark:text-zinc-200">
            Course Title <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={title}
            placeholder="e.g. UPSC Prelims Modern History Quick Revision Notes"
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) {
                setErrors((p) => {
                  const n = { ...p };
                  delete n.title;
                  return n;
                });
              }
            }}
            className={cn(
              "h-10 rounded-xl border bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-900 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]",
              errors.title ? "border-red-500 bg-red-50/20" : "border-line"
            )}
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
        </div>

        {/* 3. Subject */}
        <div className="grid gap-1.5">
          <label className="text-xs font-semibold text-forest-900 dark:text-zinc-200">
            Subject <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={subject}
            placeholder="e.g. Modern History, Physics, Quantitative Aptitude"
            onChange={(e) => {
              setSubject(e.target.value);
              if (errors.subject) {
                setErrors((p) => {
                  const n = { ...p };
                  delete n.subject;
                  return n;
                });
              }
            }}
            className={cn(
              "h-10 rounded-xl border bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-900 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]",
              errors.subject ? "border-red-500 bg-red-50/20" : "border-line"
            )}
          />
          {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
        </div>

        {/* 4. Description (Optional field) */}
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-forest-900 dark:text-zinc-200">
              Description
            </label>
            <span className="text-[11px] text-forest-900/50 dark:text-zinc-500">Optional</span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Key syllabus topics covered, summary of chapters, study guidelines..."
            className="rounded-xl border border-line bg-sage-100/40 px-3 py-2 text-sm outline-none transition focus:border-forest-900 resize-none dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]"
          />
        </div>

        {/* 5. File URL vs PDF / Notes Upload */}
        <div className="grid gap-2">
          <label className="text-xs font-semibold text-forest-900 dark:text-zinc-200">
            Notes / PDF Resource <span className="text-red-500 font-bold">*</span>
          </label>

          {/* Toggle buttons */}
          <div className="flex rounded-xl border border-line p-1 gap-1 bg-sage-100/40 dark:bg-[#27272a] dark:border-[#3f3f46]">
            <button
              type="button"
              onClick={() => {
                setFileSource("url");
                setErrors((p) => {
                  const n = { ...p };
                  delete n.fileUrl;
                  return n;
                });
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition",
                fileSource === "url"
                  ? "bg-white text-forest-900 shadow-sm dark:bg-[#18181b] dark:text-white"
                  : "text-forest-900/60 hover:text-forest-900 dark:text-zinc-400 dark:hover:text-white"
              )}
            >
              <LinkIcon className="size-3.5" />
              Enter File URL / Drive
            </button>
            <button
              type="button"
              onClick={() => {
                setFileSource("upload");
                setErrors((p) => {
                  const n = { ...p };
                  delete n.fileUrl;
                  return n;
                });
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition",
                fileSource === "upload"
                  ? "bg-white text-forest-900 shadow-sm dark:bg-[#18181b] dark:text-white"
                  : "text-forest-900/60 hover:text-forest-900 dark:text-zinc-400 dark:hover:text-white"
              )}
            >
              <Upload className="size-3.5" />
              Upload PDF / Notes
            </button>
          </div>

          {fileSource === "url" ? (
            <div className="space-y-1">
              <input
                type="url"
                value={fileUrl}
                placeholder="https://drive.google.com/file/... or https://example.com/notes.pdf"
                onChange={(e) => {
                  setFileUrl(e.target.value);
                  if (errors.fileUrl) {
                    setErrors((p) => {
                      const n = { ...p };
                      delete n.fileUrl;
                      return n;
                    });
                  }
                }}
                className={cn(
                  "h-10 w-full rounded-xl border bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-900 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]",
                  errors.fileUrl ? "border-red-500 bg-red-50/20" : "border-line"
                )}
              />
              <p className="text-[11px] text-forest-900/50 dark:text-zinc-400">
                Paste a direct download link or public Google Drive sharing link for students.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label
                htmlFor="course-file-upload-input"
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 cursor-pointer transition",
                  errors.fileUrl
                    ? "border-red-400 bg-red-50/20"
                    : fileUrl
                      ? "border-[#16a34a]/40 bg-[#16a34a]/5"
                      : "border-line hover:border-forest-900/30 bg-sage-100/20"
                )}
              >
                <input
                  id="course-file-upload-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                {fileUrl ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-forest-900 dark:text-white">
                    <FileText className="size-5 text-[#16a34a]" />
                    <span className="truncate max-w-[220px]">
                      {uploadedFileName || "Uploaded PDF Notes"}
                    </span>
                    {uploadedFileSize && (
                      <span className="text-[10px] text-forest-900/50">
                        ({Math.round(uploadedFileSize / 1024)} KB)
                      </span>
                    )}
                    <span className="ml-1 text-[10px] font-bold text-[#16a34a] underline">Change file</span>
                  </div>
                ) : (
                  <>
                    <Upload className="size-5 text-forest-900/40" />
                    <p className="text-xs font-semibold text-forest-900 dark:text-white">
                      Click to choose PDF or notes from your computer
                    </p>
                    <p className="text-[10px] text-forest-900/50 dark:text-zinc-400">
                      PDF, DOCX, TXT up to 10MB
                    </p>
                  </>
                )}
              </label>
            </div>
          )}

          {errors.fileUrl && <p className="text-xs text-red-500">{errors.fileUrl}</p>}
        </div>

        {/* Submit action */}
        <Button
          type="submit"
          disabled={saving}
          className="mt-5 w-full bg-forest-900 text-white hover:bg-forest-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Saving Course...
            </>
          ) : editing ? (
            "Save Changes"
          ) : (
            "Create Course"
          )}
        </Button>
      </form>
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
  const [togglingTopRated, setTogglingTopRated] = useState<string | null>(null);
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
    queueMicrotask(load);
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

  const handleToggleTopRated = async (id: string) => {
    setTogglingTopRated(id);
    setError(null);
    try {
      const res = await api.patch<{ course?: { isTopRated: boolean } }>(`/admin/courses/${id}/top-rated`);
      const nextVal = res.course?.isTopRated;
      setCourses((prev) =>
        prev.map((c) =>
          c._id === id
            ? { ...c, isTopRated: nextVal !== undefined ? nextVal : !c.isTopRated }
            : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle top rated status.");
    } finally {
      setTogglingTopRated(null);
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
                      {["Title", "Subject", "Exam Types", "Enrolled", "Top Rated (Home)", "Created By", "Date", ""].map((h) => (
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
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void handleToggleTopRated(c._id)}
                            disabled={togglingTopRated === c._id}
                            title={c.isTopRated ? "Remove from Top Rated on Home" : "Feature on Home Page"}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition",
                              c.isTopRated
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                : "bg-sage-100/80 text-forest-900/50 hover:bg-sage-200 hover:text-forest-900"
                            )}
                          >
                            {togglingTopRated === c._id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Star className={cn("size-3", c.isTopRated ? "fill-amber-500 text-amber-500" : "")} />
                            )}
                            {c.isTopRated ? "Top Rated" : "Standard"}
                          </button>
                        </td>
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