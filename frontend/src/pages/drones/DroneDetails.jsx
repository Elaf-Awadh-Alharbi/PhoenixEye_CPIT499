import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import api from "../../api/axios";
import { getImageUrl } from "../../utils/imageUrl";

export default function DroneDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [drone, setDrone] = useState(null);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [droneRes, reportsRes, statsRes] = await Promise.all([
        api.get(`/admin/drones/${id}`),
        api.get(`/admin/drones/${id}/reports`),
        api.get(`/admin/drones/${id}/stats`),
      ]);

      setDrone(droneRes.data);
      setReports(reportsRes.data || []);
      setStats(statsRes.data || {});
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load drone details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const batteryTone = useMemo(() => {
    const battery = Number(drone?.battery);
    if (Number.isNaN(battery)) return "neutral";
    if (battery < 20) return "danger";
    if (battery < 50) return "warning";
    return "success";
  }, [drone?.battery]);

  if (loading) return <DetailsSkeleton />;
  if (error) return <ErrorState message={error} onBack={() => navigate(-1)} />;
  if (!drone) return <ErrorState message="Drone not found" onBack={() => navigate(-1)} />;

  const hasLocation =
    drone.last_latitude != null && drone.last_longitude != null;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="rounded-2xl border border-[#2a426f] bg-[#111d37] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-[#16284a]"
      >
        ← Back to Drones
      </button>

      <section className="rounded-3xl border border-[#22365f] bg-gradient-to-r from-[#0f1b34] to-[#122447] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#38bdf8]">
              Fleet Detail View
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white">{drone.name}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Review live drone health, latest known location, mission statistics,
              and all assigned incident reports.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <DroneStatusBadge status={drone.status} />
            <ConnectivityBadge isOnline={!!drone.is_online} />
            <BatteryPill battery={drone.battery} tone={batteryTone} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Missions" value={stats?.totalReports || 0} tone="info" />
        <StatCard label="Pending Reports" value={stats?.pendingReports || 0} tone="warning" />
        <StatCard label="Verified Reports" value={stats?.verifiedReports || 0} tone="success" />
        <StatCard label="Removed Reports" value={stats?.removedReports || 0} tone="danger" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Drone Summary" subtitle="Current mission and telemetry overview.">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard label="Drone ID" value={drone.id} full />
            <InfoCard label="Status" value={<DroneStatusBadge status={drone.status} />} />
            <InfoCard
              label="Connectivity"
              value={<ConnectivityBadge isOnline={!!drone.is_online} />}
            />
            <InfoCard
              label="Battery"
              value={
                drone.battery != null ? `${drone.battery}%` : "Unavailable"
              }
            />
            <InfoCard
              label="Last Seen"
              value={
                drone.last_seen_at
                  ? new Date(drone.last_seen_at).toLocaleString()
                  : "No heartbeat received"
              }
              full
            />
            <InfoCard
              label="Coordinates"
              value={
                hasLocation
                  ? `${drone.last_latitude}, ${drone.last_longitude}`
                  : "Location unavailable"
              }
              full
            />
          </div>
        </Panel>

        <Panel title="Current Location" subtitle="Latest heartbeat position from the drone.">
          {hasLocation ? (
            <>
              <MapContainer
                center={[drone.last_latitude, drone.last_longitude]}
                zoom={15}
                style={{ height: "360px", borderRadius: "18px" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[drone.last_latitude, drone.last_longitude]}>
                  <Popup>{drone.name}</Popup>
                </Marker>
              </MapContainer>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MiniInfoCard label="Latitude" value={drone.last_latitude} />
                <MiniInfoCard label="Longitude" value={drone.last_longitude} />
              </div>
            </>
          ) : (
            <EmptyCard
              title="No location available"
              text="This drone has not sent a heartbeat with valid coordinates yet."
            />
          )}
        </Panel>
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#22365f] bg-[#0f1b34]">
        <div className="border-b border-[#22365f] px-5 py-4">
          <h3 className="text-lg font-semibold text-white">Assigned Reports</h3>
          <p className="mt-1 text-sm text-slate-400">
            Reports currently linked to this drone across the mission history.
          </p>
        </div>

        {reports.length === 0 ? (
          <EmptySection
            title="No assigned reports"
            text="This drone has not been linked to any incident reports yet."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#111d37] text-sm text-slate-300">
                <tr>
                  <th className="px-5 py-4 font-medium">Preview</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Coordinates</th>
                  <th className="px-5 py-4 font-medium">Reported At</th>
                  <th className="px-5 py-4 font-medium">Action</th>
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
                            className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-[#2a426f] bg-[#111d37] text-xs text-slate-500">
                            No image
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <ReportStatusBadge status={report.status} />
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-300">
                        {Number(report.latitude).toFixed(3)},{" "}
                        {Number(report.longitude).toFixed(3)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {dateLabel}
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          to={`/reports/${report.id}`}
                          className="rounded-xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-400/20"
                        >
                          View Report
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="rounded-3xl border border-[#22365f] bg-[#0f1b34] p-5 shadow-[0_16px_40px_rgba(2,8,23,0.35)]">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value, tone = "info" }) {
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

function InfoCard({ label, value, full = false }) {
  return (
    <div className={`rounded-2xl border border-[#22365f] bg-[#111d37] p-4 ${full ? "sm:col-span-2" : ""}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 break-all text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function MiniInfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#22365f] bg-[#111d37] p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white break-words">{value}</p>
    </div>
  );
}

function DroneStatusBadge({ status }) {
  const colors = {
    AVAILABLE: "bg-emerald-400/15 text-emerald-300",
    IN_MISSION: "bg-sky-400/15 text-sky-300",
    MAINTENANCE: "bg-amber-400/15 text-amber-300",
    OFFLINE: "bg-red-400/15 text-red-300",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colors[status] || "bg-slate-700 text-slate-200"}`}>
      {status || "UNKNOWN"}
    </span>
  );
}

function ConnectivityBadge({ isOnline }) {
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

function BatteryPill({ battery, tone = "neutral" }) {
  const tones = {
    success: "bg-emerald-400/15 text-emerald-300",
    warning: "bg-amber-400/15 text-amber-300",
    danger: "bg-red-400/15 text-red-300",
    neutral: "bg-slate-700 text-slate-200",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>
      Battery {battery != null ? `${battery}%` : "Unavailable"}
    </span>
  );
}

function ReportStatusBadge({ status }) {
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

function EmptyCard({ title, text }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#2a426f] bg-[#111d37] px-6 py-10 text-center">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}

function EmptySection({ title, text }) {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto max-w-md rounded-3xl border border-dashed border-[#2a426f] bg-[#111d37] px-6 py-10">
        <p className="text-lg font-semibold text-white">{title}</p>
        <p className="mt-2 text-sm text-slate-400">{text}</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onBack }) {
  return (
    <div className="rounded-3xl border border-red-400/20 bg-red-400/10 px-6 py-10 text-center">
      <p className="text-lg font-semibold text-red-300">Unable to load drone details</p>
      <p className="mt-2 text-sm text-red-200/90">{message}</p>
      <button
        onClick={onBack}
        className="mt-5 rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
      >
        Go Back
      </button>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 w-40 rounded-2xl bg-[#101d38]" />
      <div className="h-40 rounded-3xl bg-[#101d38]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-3xl bg-[#101d38]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-[320px] rounded-3xl bg-[#101d38]" />
        <div className="h-[420px] rounded-3xl bg-[#101d38]" />
      </div>
      <div className="h-[360px] rounded-3xl bg-[#101d38]" />
    </div>
  );
}