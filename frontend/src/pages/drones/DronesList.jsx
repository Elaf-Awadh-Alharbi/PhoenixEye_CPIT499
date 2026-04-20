import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

export default function DronesList() {
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [onlineFilter, setOnlineFilter] = useState("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDroneName, setNewDroneName] = useState("");
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDrones = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/admin/drones");
      setDrones(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load drones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrones();
    const t = setInterval(fetchDrones, 5000);
    return () => clearInterval(t);
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/drones/${id}/status`, { status });
      fetchDrones();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to update drone status");
    }
  };

  const launchDrone = async (id) => {
    try {
      await api.patch(`/admin/drones/${id}/launch`);
      fetchDrones();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to launch drone");
    }
  };

  const createDrone = async () => {
    const name = newDroneName.trim();
    if (!name) return;

    try {
      setCreating(true);
      await api.post("/admin/drones", { name });
      setIsCreateOpen(false);
      setNewDroneName("");
      fetchDrones();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to create drone");
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/drones/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchDrones();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to delete drone");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return (drones || []).filter((d) => {
      if (query && !(d.name || "").toLowerCase().includes(query)) return false;
      if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
      if (onlineFilter === "ONLINE" && !d.is_online) return false;
      if (onlineFilter === "OFFLINE" && d.is_online) return false;
      return true;
    });
  }, [drones, q, statusFilter, onlineFilter]);

  const stats = useMemo(() => {
    const total = drones.length;
    const online = drones.filter((d) => d.is_online).length;
    const offline = total - online;
    const lowBattery = drones.filter(
      (d) => d.battery != null && Number(d.battery) < 20
    ).length;

    return { total, online, offline, lowBattery };
  }, [drones]);

  const hasFilters =
    q.trim() || statusFilter !== "ALL" || onlineFilter !== "ALL";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#22365f] bg-gradient-to-r from-[#0f1b34] to-[#122447] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#38bdf8]">
              Fleet Operations
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white">
              Drone Management
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Monitor fleet health, mission readiness, and connectivity across
              all registered drones in the system.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            + Add Drone
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Drones" value={stats.total} tone="info" />
        <StatCard label="Online" value={stats.online} tone="success" />
        <StatCard label="Offline" value={stats.offline} tone="neutral" />
        <StatCard label="Low Battery" value={stats.lowBattery} tone="danger" />
      </section>

      <section className="rounded-3xl border border-[#22365f] bg-[#0f1b34] p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Filter Fleet</h3>
          <p className="mt-1 text-sm text-slate-400">
            Search by drone name and filter by mission state or connectivity.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by drone name..."
            className="rounded-2xl border border-[#22365f] bg-[#111d37] p-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
          />

          <select
            className="rounded-2xl border border-[#22365f] bg-[#111d37] p-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="IN_MISSION">IN_MISSION</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
            <option value="OFFLINE">OFFLINE</option>
          </select>

          <select
            className="rounded-2xl border border-[#22365f] bg-[#111d37] p-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
            value={onlineFilter}
            onChange={(e) => setOnlineFilter(e.target.value)}
          >
            <option value="ALL">All Connectivity</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
          </select>

          <div className="flex gap-3">
            <button
              onClick={fetchDrones}
              className="flex-1 rounded-2xl border border-[#2a426f] bg-[#111d37] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-[#16284a]"
            >
              Refresh
            </button>

            <button
              onClick={() => {
                setQ("");
                setStatusFilter("ALL");
                setOnlineFilter("ALL");
              }}
              className="flex-1 rounded-2xl border border-[#2a426f] bg-[#111d37] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-[#16284a]"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#22365f] bg-[#0f1b34]">
        <div className="border-b border-[#22365f] px-5 py-4">
          <h3 className="text-lg font-semibold text-white">Fleet Table</h3>
          <p className="mt-1 text-sm text-slate-400">
            Inspect live drone status, battery level, last known position, and
            mission controls.
          </p>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchDrones} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No drones found"
            text={
              hasFilters
                ? "No drones match your current filters. Try resetting the filters and searching again."
                : "No drones have been added yet. Create your first drone to begin fleet operations."
            }
            onClear={
              hasFilters
                ? () => {
                    setQ("");
                    setStatusFilter("ALL");
                    setOnlineFilter("ALL");
                  }
                : null
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#111d37] text-sm text-slate-300">
                <tr>
                  <th className="px-5 py-4 font-medium">Drone</th>
                  <th className="px-5 py-4 font-medium">Mission Status</th>
                  <th className="px-5 py-4 font-medium">Connectivity</th>
                  <th className="px-5 py-4 font-medium">Battery</th>
                  <th className="px-5 py-4 font-medium">Location</th>
                  <th className="px-5 py-4 font-medium">Last Seen</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((drone) => {
                  const lat = drone.last_latitude;
                  const lon = drone.last_longitude;
                  const battery = drone.battery ?? null;
                  const isCritical =
                    battery !== null && Number(battery) < 20;

                  return (
                    <tr
                      key={drone.id}
                      className="border-t border-[#1f3157] transition hover:bg-[#111d37]"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-white">{drone.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            ID: {drone.id.slice(0, 8)}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <DroneStatusBadge status={drone.status} />
                      </td>

                      <td className="px-5 py-4">
                        <OnlineBadge isOnline={!!drone.is_online} />
                      </td>

                      <td className="px-5 py-4">
                        {battery == null ? (
                          <span className="text-slate-500">—</span>
                        ) : (
                          <BatteryBar battery={battery} isCritical={isCritical} />
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-300">
                        {lat != null && lon != null
                          ? `${Number(lat).toFixed(3)}, ${Number(lon).toFixed(3)}`
                          : "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {drone.last_seen_at
                          ? new Date(drone.last_seen_at).toLocaleString()
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/drones/${drone.id}`}
                            className="rounded-xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-400/20"
                          >
                            View
                          </Link>

                          <select
                            className="rounded-xl border border-[#22365f] bg-[#111d37] px-3 py-2 text-sm text-slate-100 outline-none"
                            onChange={(e) =>
                              updateStatus(drone.id, e.target.value)
                            }
                            value={drone.status}
                          >
                            <option value="AVAILABLE">AVAILABLE</option>
                            <option value="IN_MISSION">IN_MISSION</option>
                            <option value="MAINTENANCE">MAINTENANCE</option>
                            <option value="OFFLINE">OFFLINE</option>
                          </select>

                          <button
                            onClick={() => launchDrone(drone.id)}
                            disabled={drone.status !== "AVAILABLE"}
                            className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Launch
                          </button>

                          <button
                            onClick={() => setDeleteTarget(drone)}
                            className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-400/20"
                          >
                            Delete
                          </button>
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

      {isCreateOpen && (
        <Modal
          title="Add Drone"
          subtitle="Create a new drone entry for the fleet."
          onClose={() => !creating && setIsCreateOpen(false)}
        >
          <div className="space-y-4">
            <input
              value={newDroneName}
              onChange={(e) => setNewDroneName(e.target.value)}
              placeholder="Drone name (e.g. Drone Alpha 02)"
              className="w-full rounded-2xl border border-[#22365f] bg-[#111d37] p-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-2xl border border-[#2a426f] bg-[#111d37] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-[#16284a]"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={createDrone}
                className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
                disabled={creating || !newDroneName.trim()}
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          title="Confirm Delete"
          subtitle="This drone entry will be removed from the active fleet view."
          onClose={() => !deleting && setDeleteTarget(null)}
        >
          <p className="text-sm text-slate-300">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-white">{deleteTarget.name}</span>?
          </p>

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-2xl border border-[#2a426f] bg-[#111d37] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-[#16284a]"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ label, value, tone = "info" }) {
  const tones = {
    success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    danger: "border-red-400/20 bg-red-400/10 text-red-300",
    info: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    neutral: "border-[#2a426f] bg-[#111d37] text-slate-200",
  };

  return (
    <div className={`rounded-3xl border p-5 ${tones[tone]}`}>
      <p className="text-sm">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}

function DroneStatusBadge({ status }) {
  const colors = {
    AVAILABLE: "bg-emerald-400/15 text-emerald-300",
    IN_MISSION: "bg-sky-400/15 text-sky-300",
    MAINTENANCE: "bg-amber-400/15 text-amber-300",
    OFFLINE: "bg-red-400/15 text-red-300",
    UNKNOWN: "bg-slate-700 text-slate-200",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colors[status] || colors.UNKNOWN}`}>
      {status || "UNKNOWN"}
    </span>
  );
}

function OnlineBadge({ isOnline }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#111d37] px-3 py-1.5 text-xs font-medium text-slate-200">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          isOnline ? "bg-emerald-400" : "bg-slate-500"
        }`}
      />
      {isOnline ? "Online" : "Offline"}
    </span>
  );
}

function BatteryBar({ battery, isCritical }) {
  return (
    <div className="min-w-[130px]">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-200">{battery}%</span>
        {isCritical && <span className="text-red-300">Low</span>}
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#16284a]">
        <div
          className={`h-full rounded-full ${
            isCritical ? "bg-red-400" : "bg-emerald-400"
          }`}
          style={{ width: `${Math.max(0, Math.min(100, Number(battery)))}%` }}
        />
      </div>
    </div>
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
        <p className="text-lg font-semibold text-red-300">Unable to load drones</p>
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

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-[#22365f] bg-[#0f1b34] p-5 shadow-[0_20px_60px_rgba(2,8,23,0.55)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-[#22365f] bg-[#111d37] px-3 py-1.5 text-sm text-slate-300 transition hover:bg-[#16284a]"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}