import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { getImageUrl } from "../../utils/imageUrl";

const initialFilters = {
  status: "",
  source: "",
  dateFrom: "",
  dateTo: "",
};

export default function ReportsList() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/admin/reports", {
        params: {
          ...filters,
          page,
          limit: 10,
        },
      });

      setReports(res.data.data || []);
      setPages(Math.max(res.data.pages || 1, 1));
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filters, page]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/reports/${id}/status`, { status });
      fetchReports();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to update status");
    }
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  const summary = useMemo(() => {
    return {
      pending: reports.filter((r) => r.status === "PENDING").length,
      verified: reports.filter((r) => r.status === "VERIFIED").length,
      assigned: reports.filter((r) => r.status === "ASSIGNED").length,
      removed: reports.filter((r) => r.status === "REMOVED").length,
    };
  }, [reports]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#22365f] bg-gradient-to-r from-[#0f1b34] to-[#122447] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#38bdf8]">
              Incident Operations
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white">
              Reports Management
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Review incoming roadkill incidents, verify report validity, and
              coordinate drone response from a single operational queue.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatChip label="Total Results" value={total} tone="info" />
            <StatChip label="Current Page" value={page} tone="neutral" />
            <button
              onClick={resetFilters}
              className="rounded-2xl border border-[#2a426f] bg-[#111d37] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-[#16284a]"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Pending" value={summary.pending} tone="warning" />
        <SummaryCard label="Verified" value={summary.verified} tone="success" />
        <SummaryCard label="Assigned" value={summary.assigned} tone="info" />
        <SummaryCard label="Removed" value={summary.removed} tone="danger" />
      </section>

      <section className="rounded-3xl border border-[#22365f] bg-[#0f1b34] p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Filter Reports</h3>
          <p className="mt-1 text-sm text-slate-400">
            Narrow results by workflow stage, source type, or date range.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <select
            value={filters.status}
            className="rounded-2xl border border-[#22365f] bg-[#111d37] p-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
            onChange={(e) => {
              setPage(1);
              setFilters({ ...filters, status: e.target.value });
            }}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="REMOVED">Removed</option>
          </select>

          <select
            value={filters.source}
            className="rounded-2xl border border-[#22365f] bg-[#111d37] p-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
            onChange={(e) => {
              setPage(1);
              setFilters({ ...filters, source: e.target.value });
            }}
          >
            <option value="">All Sources</option>
            <option value="CITIZEN">Citizen</option>
            <option value="DRONE">Drone</option>
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            className="rounded-2xl border border-[#22365f] bg-[#111d37] p-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
            onChange={(e) => {
              setPage(1);
              setFilters({ ...filters, dateFrom: e.target.value });
            }}
          />

          <input
            type="date"
            value={filters.dateTo}
            className="rounded-2xl border border-[#22365f] bg-[#111d37] p-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
            onChange={(e) => {
              setPage(1);
              setFilters({ ...filters, dateTo: e.target.value });
            }}
          />

          <button
            onClick={fetchReports}
            className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Apply Filters
          </button>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.status && <ActiveFilter label={`Status: ${filters.status}`} />}
            {filters.source && <ActiveFilter label={`Source: ${filters.source}`} />}
            {filters.dateFrom && <ActiveFilter label={`From: ${filters.dateFrom}`} />}
            {filters.dateTo && <ActiveFilter label={`To: ${filters.dateTo}`} />}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#22365f] bg-[#0f1b34]">
        <div className="border-b border-[#22365f] px-5 py-4">
          <h3 className="text-lg font-semibold text-white">Incident Queue</h3>
          <p className="mt-1 text-sm text-slate-400">
            View recent reports and take action on pending incidents.
          </p>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchReports} />
        ) : reports.length === 0 ? (
          <EmptyState
            title="No reports found"
            text={
              hasActiveFilters
                ? "No reports match the selected filters. Try clearing the filters and searching again."
                : "No incidents have been submitted yet. New reports will appear here automatically."
            }
            onClear={hasActiveFilters ? resetFilters : null}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#111d37] text-sm text-slate-300">
                <tr>
                  <th className="px-5 py-4 font-medium">Preview</th>
                  <th className="px-5 py-4 font-medium">Source</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Coordinates</th>
                  <th className="px-5 py-4 font-medium">Reported At</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {reports.map((report) => {
                  const dateStr = report.createdAt || report.created_at;
                  const dateLabel = dateStr
                    ? new Date(dateStr).toLocaleString()
                    : "—";

                  return (
                    <tr
                      key={report.id}
                      className="border-t border-[#1f3157] transition hover:bg-[#111d37]"
                    >
                      <td className="px-5 py-4">
                        {report.image_url ? (
                          <img
                            src={getImageUrl(report.image_url)}
                            alt="Report"
                            className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-[#2a426f] bg-[#111d37] text-xs text-slate-500">
                            No image
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <SourceBadge source={report.source} />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={report.status} />
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-300">
                        {Number(report.latitude).toFixed(3)},{" "}
                        {Number(report.longitude).toFixed(3)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {dateLabel}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/reports/${report.id}`}
                            className="rounded-xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-400/20"
                          >
                            View
                          </Link>

                          {report.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => updateStatus(report.id, "VERIFIED")}
                                className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20"
                              >
                                Verify
                              </button>

                              <button
                                onClick={() => updateStatus(report.id, "REMOVED")}
                                className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-400/20"
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!loading && !error && total > 0 && (
        <section className="flex flex-col gap-4 rounded-3xl border border-[#22365f] bg-[#0f1b34] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-400">
            Showing page <span className="font-semibold text-white">{page}</span> of{" "}
            <span className="font-semibold text-white">{pages}</span>
          </p>

          <div className="flex gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="rounded-2xl border border-[#2a426f] bg-[#111d37] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-[#16284a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
              className="rounded-2xl border border-[#2a426f] bg-[#111d37] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-[#16284a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone = "info" }) {
  const tones = {
    warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    info: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    danger: "border-red-400/20 bg-red-400/10 text-red-300",
  };

  return (
    <div className={`rounded-3xl border p-5 ${tones[tone]}`}>
      <p className="text-sm">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}

function StatChip({ label, value, tone = "neutral" }) {
  const tones = {
    neutral: "border-[#2a426f] bg-[#111d37] text-slate-200",
    info: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ActiveFilter({ label }) {
  return (
    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
      {label}
    </span>
  );
}

function SourceBadge({ source }) {
  const styles = {
    CITIZEN: "bg-sky-400/15 text-sky-300",
    DRONE: "bg-violet-400/15 text-violet-300",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[source] || "bg-slate-700 text-slate-200"}`}>
      {source}
    </span>
  );
}

function StatusBadge({ status }) {
  const colors = {
    PENDING: "bg-amber-400/15 text-amber-300",
    VERIFIED: "bg-emerald-400/15 text-emerald-300",
    ASSIGNED: "bg-sky-400/15 text-sky-300",
    REMOVED: "bg-red-400/15 text-red-300",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colors[status] || "bg-slate-700 text-slate-200"}`}>
      {status}
    </span>
  );
}

function EmptyState({ title, text, onClear }) {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto max-w-md rounded-3xl border border-dashed border-[#2a426f] bg-[#111d37] px-6 py-10">
        <p className="text-lg font-semibold text-white">{title}</p>
        <p className="mt-2 text-sm text-slate-400">{text}</p>

        {onClear && (
          <button
            onClick={onClear}
            className="mt-5 rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto max-w-md rounded-3xl border border-red-400/20 bg-red-400/10 px-6 py-8">
        <p className="text-lg font-semibold text-red-300">Unable to load reports</p>
        <p className="mt-2 text-sm text-red-200/90">{message}</p>
        <button
          onClick={onRetry}
          className="mt-5 rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse p-5">
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-[#111d37]" />
        ))}
      </div>
    </div>
  );
}