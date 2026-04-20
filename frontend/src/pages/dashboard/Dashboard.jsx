import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [dashboardRes, liveRes] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/drones/live"),
      ]);

      setData(dashboardRes.data);
      setLiveData(liveRes.data);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();

    const interval = setInterval(() => {
      fetchAll();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const statusMap = useMemo(() => {
    const map = {
      PENDING: 0,
      VERIFIED: 0,
      ASSIGNED: 0,
      REMOVED: 0,
    };

    if (data?.statusCounts?.length) {
      data.statusCounts.forEach((item) => {
        map[item.status] = Number(item.count);
      });
    }

    return map;
  }, [data]);

  const criticalCount =
    liveData?.drones?.filter((drone) => drone.is_critical).length || 0;

  const recentReports = data?.recentReports || [];
  const liveDrones = liveData?.drones || [];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-5 sm:space-y-6 xl:space-y-8">
      <section className="rounded-3xl border border-[#22365f] bg-gradient-to-r from-[#0f1b34] to-[#122447] p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#38bdf8] sm:text-sm">
              Operations Overview
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Phoenix Eye Control Center
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Monitor incident activity, drone availability, and response
              readiness across the system from one unified command dashboard.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[420px]">
            <QuickStat label="Pending" value={statusMap.PENDING} tone="warning" />
            <QuickStat label="Verified" value={statusMap.VERIFIED} tone="success" />
            <QuickStat label="Assigned" value={statusMap.ASSIGNED} tone="info" />
            <QuickStat label="Removed" value={statusMap.REMOVED} tone="danger" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Reports"
          value={data?.totalReports ?? 0}
          subtitle="All recorded incidents"
          accent="emerald"
        />
        <KpiCard
          title="Total Drones"
          value={data?.totalDrones ?? 0}
          subtitle="Fleet inventory"
          accent="sky"
        />
        <KpiCard
          title="Online Drones"
          value={liveData?.online ?? 0}
          subtitle="Actively connected now"
          accent="green"
        />
        <KpiCard
          title="Critical Battery"
          value={criticalCount}
          subtitle="Drones below 20%"
          accent="amber"
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          title="Report Status Distribution"
          subtitle="Live breakdown of incident workflow states."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatusCard
              label="Pending Review"
              value={statusMap.PENDING}
              color="yellow"
            />
            <StatusCard
              label="Verified"
              value={statusMap.VERIFIED}
              color="green"
            />
            <StatusCard
              label="Assigned"
              value={statusMap.ASSIGNED}
              color="blue"
            />
            <StatusCard
              label="Removed"
              value={statusMap.REMOVED}
              color="red"
            />
          </div>
        </Panel>

        <Panel
          title="Operational Alerts"
          subtitle="High-priority issues that may need action."
        >
          <div className="space-y-3">
            <AlertRow
              tone={criticalCount > 0 ? "warning" : "neutral"}
              title="Low Battery Drones"
              text={
                criticalCount > 0
                  ? `${criticalCount} drone(s) require charging attention.`
                  : "No critical battery alerts at the moment."
              }
            />
            <AlertRow
              tone={(liveData?.offline ?? 0) > 0 ? "danger" : "neutral"}
              title="Offline Fleet"
              text={
                (liveData?.offline ?? 0) > 0
                  ? `${liveData?.offline} drone(s) are currently offline.`
                  : "All active fleet connections look healthy."
              }
            />
            <AlertRow
              tone={statusMap.PENDING > 0 ? "info" : "neutral"}
              title="Pending Reports"
              text={
                statusMap.PENDING > 0
                  ? `${statusMap.PENDING} report(s) are waiting for review.`
                  : "No pending reports waiting in the queue."
              }
            />
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Live Drone Activity"
          subtitle="Real-time snapshot of fleet connectivity and power state."
        >
          {liveDrones.length === 0 ? (
            <EmptyState
              title="No drones available"
              text="No fleet activity is visible yet. Add a drone or wait for heartbeat updates."
            />
          ) : (
            <div className="space-y-3">
              {liveDrones.slice(0, 6).map((drone) => (
                <div
                  key={drone.id}
                  className="rounded-2xl border border-[#22365f] bg-[#111d37] px-4 py-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {drone.name}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {drone.last_seen_at
                          ? `Last seen ${new Date(
                              drone.last_seen_at
                            ).toLocaleString()}`
                          : "No heartbeat received yet"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={drone.is_online ? "success" : "neutral"}>
                        {drone.is_online ? "Online" : "Offline"}
                      </Pill>
                      <Pill tone="info">{drone.status || "UNKNOWN"}</Pill>
                      <Pill tone={drone.is_critical ? "danger" : "neutral"}>
                        Battery {drone.battery ?? 0}%
                      </Pill>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Recent Reports"
          subtitle="Latest incidents added to the system."
        >
          {recentReports.length === 0 ? (
            <EmptyState
              title="No reports yet"
              text="Recent incident activity will appear here once reports are submitted."
            />
          ) : (
            <div className="space-y-3">
              {recentReports.map((report) => {
                const dateStr = report.createdAt || report.created_at;
                const dateLabel = dateStr
                  ? new Date(dateStr).toLocaleString()
                  : "—";

                return (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-[#22365f] bg-[#111d37] px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-white">
                          Incident #{report.id.slice(0, 8)}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {Number(report.latitude).toFixed(3)},{" "}
                          {Number(report.longitude).toFixed(3)}
                        </p>
                      </div>

                      <div className="sm:shrink-0">
                        <Pill
                          tone={
                            report.status === "PENDING"
                              ? "warning"
                              : report.status === "VERIFIED"
                              ? "success"
                              : report.status === "ASSIGNED"
                              ? "info"
                              : "danger"
                          }
                        >
                          {report.status}
                        </Pill>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">{dateLabel}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}

function KpiCard({ title, value, subtitle, accent = "emerald" }) {
  const accents = {
    emerald: "from-emerald-400/20 to-emerald-500/5 border-emerald-400/20",
    sky: "from-sky-400/20 to-sky-500/5 border-sky-400/20",
    green: "from-green-400/20 to-green-500/5 border-green-400/20",
    amber: "from-amber-400/20 to-amber-500/5 border-amber-400/20",
  };

  return (
    <div
      className={`rounded-3xl border bg-gradient-to-br p-4 shadow-[0_16px_40px_rgba(2,8,23,0.35)] sm:p-5 ${accents[accent]}`}
    >
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function QuickStat({ label, value, tone = "info" }) {
  const tones = {
    warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    info: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    danger: "border-red-400/20 bg-red-400/10 text-red-300",
  };

  return (
    <div className={`rounded-2xl border px-3 py-3 sm:px-4 ${tones[tone]}`}>
      <p className="text-[11px] uppercase tracking-wide sm:text-xs">{label}</p>
      <p className="mt-2 text-xl font-bold sm:text-2xl">{value}</p>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="rounded-3xl border border-[#22365f] bg-[#0f1b34] p-4 shadow-[0_16px_40px_rgba(2,8,23,0.35)] sm:p-5">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-white sm:text-lg">
          {title}
        </h3>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function StatusCard({ label, value, color = "blue" }) {
  const styles = {
    yellow: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    blue: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    red: "border-red-400/20 bg-red-400/10 text-red-300",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[color]}`}>
      <p className="text-sm">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}

function AlertRow({ title, text, tone = "neutral" }) {
  const tones = {
    neutral: "border-[#22365f] bg-[#111d37]",
    warning: "border-amber-400/20 bg-amber-400/10",
    danger: "border-red-400/20 bg-red-400/10",
    info: "border-sky-400/20 bg-sky-400/10",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="font-medium text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-700/60 text-slate-200",
    success: "bg-emerald-400/15 text-emerald-300",
    warning: "bg-amber-400/15 text-amber-300",
    danger: "bg-red-400/15 text-red-300",
    info: "bg-sky-400/15 text-sky-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#2a426f] bg-[#111d37] px-5 py-10 text-center">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{text}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse sm:space-y-6 xl:space-y-8">
      <div className="h-40 rounded-3xl bg-[#101d38]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-3xl bg-[#101d38]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="h-72 rounded-3xl bg-[#101d38]" />
        <div className="h-72 rounded-3xl bg-[#101d38]" />
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="h-80 rounded-3xl bg-[#101d38]" />
        <div className="h-80 rounded-3xl bg-[#101d38]" />
      </div>
    </div>
  );
}