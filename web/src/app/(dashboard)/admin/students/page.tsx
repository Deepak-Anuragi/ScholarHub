"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, flexRender, createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronsUpDown, Download, Loader2 } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { DataError } from "@/components/dashboard/DataError";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { downloadCSV } from "@/lib/csv";

type ActiveBooking = { libraryId: { name: string; city: string } };
type Student = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  examType?: string;
  createdAt: string;
  activeBooking: ActiveBooking | null;
};

const helper = createColumnHelper<Student>();

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [examFilter, setExamFilter] = useState("all");
  const [bookingFilter, setBookingFilter] = useState("all");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<{ students?: Student[] }>("/admin/students")
      .then((d) => setStudents(d.students ?? []))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Something went wrong.")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const examTypes = useMemo(() => {
    const types = new Set(students.map((s) => s.examType).filter(Boolean) as string[]);
    return ["all", ...types];
  }, [students]);

  const cities = useMemo(() => {
    const values = new Set(students.map((s) => s.city).filter(Boolean) as string[]);
    return ["all", ...values];
  }, [students]);

  const filtered = useMemo(
    () => students.filter((s) => {
      const bookingStatus = s.activeBooking ? "ACTIVE" : "NONE";

      return (
        (cityFilter === "all" || s.city === cityFilter) &&
        (examFilter === "all" || s.examType === examFilter) &&
        (bookingFilter === "all" || bookingStatus === bookingFilter)
      );
    }),
    [bookingFilter, cityFilter, examFilter, students]
  );

  const columns = useMemo(() => [
    helper.accessor("name", {
      header: "Name",
      cell: (i) => <span className="font-medium text-forest-900">{i.getValue()}</span>,
    }),
    helper.accessor("email", { header: "Email", cell: (i) => <span className="text-forest-900/70">{i.getValue()}</span> }),
    helper.accessor("phone", { header: "Phone", cell: (i) => i.getValue() ?? "—" }),
    helper.accessor("city", { header: "City", cell: (i) => i.getValue() ?? "—" }),
    helper.accessor("examType", { header: "Exam", cell: (i) => i.getValue() ?? "—" }),
    helper.accessor((r) => r.activeBooking?.libraryId?.name ?? "—", {
      id: "library",
      header: "Current Library",
      cell: (i) => <span className="text-forest-900/70">{i.getValue()}</span>,
    }),
    helper.accessor((r) => r.activeBooking ? "ACTIVE" : "NONE", {
      id: "bookingStatus",
      header: "Booking",
      cell: (i) => (
        <span className={
          i.getValue() === "ACTIVE"
            ? "rounded-full bg-[#16a34a]/10 px-2 py-0.5 text-[10px] font-semibold text-[#16a34a]"
            : "rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-semibold text-forest-900/50"
        }>
          {i.getValue()}
        </span>
      ),
    }),
    helper.accessor("createdAt", {
      header: "Joined",
      cell: (i) => new Date(i.getValue() as string).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    }),
  ], []);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (r) => r._id,
  });

  const handleExport = () => {
    downloadCSV(
      filtered.map((s) => ({
        name: s.name, email: s.email, phone: s.phone ?? "",
        city: s.city ?? "", examType: s.examType ?? "",
        currentLibrary: s.activeBooking?.libraryId?.name ?? "",
        bookingStatus: s.activeBooking ? "ACTIVE" : "NONE",
        joined: new Date(s.createdAt).toLocaleDateString("en-IN"),
      })),
      "scholarshub-students.csv"
    );
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">Students</h1>
            <p className="mt-1 text-sm text-forest-900/60">{students.length} registered students</p>
          </div>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="size-3.5" /> Export CSV
          </Button>
        </div>
      </AnimatedContent>

      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search students…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 w-full max-w-sm rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-900"
          />
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="h-9 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-900"
          >
            {cities.map((t) => (
              <option key={t} value={t}>{t === "all" ? "All Cities" : t}</option>
            ))}
          </select>
          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="h-9 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-900"
          >
            {examTypes.map((t) => (
              <option key={t} value={t}>{t === "all" ? "All Exam Types" : t}</option>
            ))}
          </select>
          <select
            value={bookingFilter}
            onChange={(e) => setBookingFilter(e.target.value)}
            className="h-9 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-900"
          >
            <option value="all">All Booking Statuses</option>
            <option value="ACTIVE">Active Booking</option>
            <option value="NONE">No Active Booking</option>
          </select>
        </div>
      </AnimatedContent>

      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.08}>
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
          {error ? (
            <DataError message={error} onRetry={load} />
          ) : loading ? (
            <div className="flex h-52 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-forest-900/40" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-sage-100/50">
                    {table.getFlatHeaders().map((h) => (
                      <th key={h.id}
                        className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-forest-900/40 whitespace-nowrap"
                        onClick={h.column.getToggleSortingHandler()}
                        style={{ cursor: h.column.getCanSort() ? "pointer" : "default" }}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getCanSort() && <ChevronsUpDown className="size-3 opacity-40" />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr><td colSpan={columns.length} className="py-10 text-center text-sm text-forest-900/40">No students found.</td></tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="border-b border-line last:border-0 hover:bg-sage-100/20">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AnimatedContent>
    </div>
  );
}
