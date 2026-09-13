"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type HeaderContext,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import {
  CheckCircle, Download, ExternalLink, Loader2,
  ShieldOff, Trash2, ChevronsUpDown,
} from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { DataError } from "@/components/dashboard/DataError";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { downloadCSV } from "@/lib/csv";
import { cn } from "@/lib/utils";

type Owner = { _id: string; name: string; email: string; phone?: string };
type Library = {
  _id: string;
  name: string;
  city: string;
  district: string;
  state: string;
  monthlyRevenue: number;
  totalSeats: number;
  ratingAvg: number;
  isVerified: boolean;
  isActive: boolean;
  ownerId: Owner | null;
};

type FilterOptions = {
  states: string[];
  districts: string[];
  cities: string[];
};

const helper = createColumnHelper<Library>();

export default function AdminLibrariesPage() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    states: [],
    districts: [],
    cities: [],
  });

  const loadLibraries = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (stateFilter) params.set("state", stateFilter);
    if (districtFilter) params.set("district", districtFilter);
    if (cityFilter) params.set("city", cityFilter);

    setError(null);
    api
      .get<{ libraries?: Library[] }>(`/admin/libraries?${params.toString()}`)
      .then((d) => setLibraries(d.libraries ?? []))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Something went wrong.")
      )
      .finally(() => setLoading(false));
  }, [cityFilter, districtFilter, stateFilter]);

  useEffect(() => {
    loadLibraries();
  }, [loadLibraries]);

  useEffect(() => {
    const params = new URLSearchParams({ mode: "filters" });
    if (stateFilter) params.set("state", stateFilter);
    if (districtFilter) params.set("district", districtFilter);

    api
      .get<FilterOptions>(`/admin/libraries?${params.toString()}`)
      .then((d) =>
        setFilterOptions({
          states: d.states ?? [],
          districts: d.districts ?? [],
          cities: d.cities ?? [],
        })
      )
      .catch(() => {
        // Filter dropdowns are a convenience; the table already reports the
        // real failure, so keep whatever options we last had.
      });
  }, [districtFilter, stateFilter]);

  const updateLib = (id: string, patch: Partial<Library>) =>
    setLibraries((prev) => prev.map((l) => (l._id === id ? { ...l, ...patch } : l)));

  const handleVerify = async (id: string) => {
    setActing(id + "_verify");
    setError(null);
    try {
      await api.patch(`/admin/libraries/${id}/verify`);
      updateLib(id, { isVerified: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify the library.");
    }
    setActing(null);
  };

  const handleSuspend = async (id: string) => {
    setActing(id + "_suspend");
    setError(null);
    try {
      await api.patch(`/admin/libraries/${id}/suspend`);
      updateLib(id, { isActive: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not suspend the library.");
    }
    setActing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this library?")) return;
    setActing(id + "_delete");
    setError(null);
    try {
      await api.delete(`/admin/libraries/${id}`);
      setLibraries((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the library.");
    }
    setActing(null);
  };

  const handleBulk = async (action: "verify" | "suspend") => {
    if (selected.size === 0) return;
    setError(null);
    try {
      await api.patch("/admin/libraries", { action, ids: [...selected] });
      selected.forEach((id) =>
        updateLib(id, action === "verify" ? { isVerified: true } : { isActive: false })
      );
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk action failed.");
    }
  };

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }: HeaderContext<Library, unknown>) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="accent-forest-900"
          />
        ),
        cell: ({ row }: { row: Row<Library> }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="accent-forest-900"
          />
        ),
        size: 36,
      },
      helper.accessor("name", {
        header: "Library",
        cell: (i) => <span className="font-medium text-forest-900">{i.getValue()}</span>,
      }),
      helper.accessor("city", { header: "City" }),
      helper.accessor((r) => r.ownerId?.name ?? "—", {
        id: "owner",
        header: "Owner",
        cell: (i) => <span className="text-forest-900/70">{i.getValue()}</span>,
      }),
      helper.accessor("totalSeats", { header: "Seats" }),
      helper.accessor("monthlyRevenue", {
        header: "Monthly Revenue",
        cell: (i) => `₹${(i.getValue() as number).toLocaleString("en-IN")}`,
      }),
      helper.accessor("ratingAvg", {
        header: "Rating",
        cell: (i) => (i.getValue() as number).toFixed(1),
      }),
      helper.accessor("isVerified", {
        header: "Verified",
        cell: (i) =>
          i.getValue() ? (
            <span className="rounded-full bg-[#16a34a]/10 px-2 py-0.5 text-[10px] font-semibold text-[#16a34a]">Yes</span>
          ) : (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">No</span>
          ),
      }),
      helper.accessor("isActive", {
        header: "Active",
        cell: (i) =>
          i.getValue() ? (
            <span className="rounded-full bg-[#16a34a]/10 px-2 py-0.5 text-[10px] font-semibold text-[#16a34a]">Active</span>
          ) : (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">Suspended</span>
          ),
      }),
      {
        id: "actions",
        header: "",
        cell: ({ row }: { row: Row<Library> }) => {
          const lib = row.original;
          return (
            <div className="flex items-center gap-1">
              <a href={`/library/${lib._id}`} target="_blank" rel="noopener noreferrer"
                className="flex size-7 items-center justify-center rounded-lg text-forest-900/50 hover:bg-sage-100 hover:text-forest-900 transition">
                <ExternalLink className="size-3.5" />
              </a>
              {!lib.isVerified && (
                <button type="button" onClick={() => void handleVerify(lib._id)}
                  disabled={acting === lib._id + "_verify"}
                  className="flex size-7 items-center justify-center rounded-lg text-[#16a34a] hover:bg-[#16a34a]/10 transition">
                  {acting === lib._id + "_verify" ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
                </button>
              )}
              {lib.isActive && (
                <button type="button" onClick={() => void handleSuspend(lib._id)}
                  disabled={acting === lib._id + "_suspend"}
                  className="flex size-7 items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50 transition">
                  {acting === lib._id + "_suspend" ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldOff className="size-3.5" />}
                </button>
              )}
              <button type="button" onClick={() => void handleDelete(lib._id)}
                disabled={acting === lib._id + "_delete"}
                className="flex size-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition">
                {acting === lib._id + "_delete" ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              </button>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [acting]
  );

  const table = useReactTable({
    data: libraries,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection: Object.fromEntries([...selected].map((id) => [id, true])),
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function"
        ? updater(Object.fromEntries([...selected].map((id) => [id, true])))
        : updater;
      setSelected(new Set(Object.keys(next).filter((id) => next[id])));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row._id,
    enableRowSelection: true,
  });

  const handleExport = () => {
    downloadCSV(
      libraries.map((l) => ({
        name: l.name, city: l.city, district: l.district, state: l.state,
        owner: l.ownerId?.name ?? "", ownerEmail: l.ownerId?.email ?? "",
        totalSeats: l.totalSeats, monthlyRevenue: l.monthlyRevenue,
        ratingAvg: l.ratingAvg, isVerified: l.isVerified, isActive: l.isActive,
      })),
      "scholarshub-libraries.csv"
    );
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">Libraries</h1>
            <p className="mt-1 text-sm text-forest-900/60">
              {libraries.length} libraries registered on the platform
            </p>
          </div>
          <div className="flex gap-2">
            {selected.size > 0 && (
              <>
                <Button size="sm" className="bg-[#16a34a] text-white hover:bg-[#15803d]"
                  onClick={() => void handleBulk("verify")}>
                  Verify {selected.size}
                </Button>
                <Button size="sm" variant="outline" onClick={() => void handleBulk("suspend")}>
                  Suspend {selected.size}
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="size-3.5" /> Export CSV
            </Button>
          </div>
        </div>
      </AnimatedContent>

      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by name, city, owner…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 w-full max-w-sm rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-900"
          />
          <select
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setDistrictFilter("");
              setCityFilter("");
              setSelected(new Set());
            }}
            className="h-9 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-900"
          >
            <option value="">All States</option>
            {filterOptions.states.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          <select
            value={districtFilter}
            onChange={(e) => {
              setDistrictFilter(e.target.value);
              setCityFilter("");
              setSelected(new Set());
            }}
            disabled={!stateFilter}
            className="h-9 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-900 disabled:opacity-50"
          >
            <option value="">All Districts</option>
            {filterOptions.districts.map((district) => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setSelected(new Set());
            }}
            disabled={!districtFilter}
            className="h-9 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none transition focus:border-forest-900 disabled:opacity-50"
          >
            <option value="">All Cities</option>
            {filterOptions.cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </AnimatedContent>

      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.08}>
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
          {error ? (
            <DataError message={error} onRetry={loadLibraries} />
          ) : loading ? (
            <div className="flex h-52 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-forest-900/40" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-sage-100/50">
                    {table.getFlatHeaders().map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-forest-900/40 whitespace-nowrap"
                        onClick={header.column.getToggleSortingHandler()}
                        style={{ cursor: header.column.getCanSort() ? "pointer" : "default" }}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && <ChevronsUpDown className="size-3 opacity-40" />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
          <td colSpan={columns.length} className="py-10 text-center text-sm text-forest-900/40">
                        No libraries found.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className={cn("border-b border-line last:border-0 hover:bg-sage-100/20", row.getIsSelected() && "bg-sage-100/40")}>
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
