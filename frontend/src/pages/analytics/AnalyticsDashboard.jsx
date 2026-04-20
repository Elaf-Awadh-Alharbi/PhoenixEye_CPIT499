import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, timeRes, heatRes] = await Promise.all([
        api.get("/admin/reports/stats"),
        api.get("/admin/analytics/timeseries"),
        api.get("/admin/analytics/heatmap"),
      ]);

      setStats(statsRes.data);
      setTimeSeries(timeRes.data || []);
      setHeatmap(heatRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Pending", value: stats.pending || 0 },
      { name: "Verified", value: stats.verified || 0 },
      { name: "Removed", value: stats.removed || 0 },
    ];
  }, [stats]);

  const topHotspot = heatmap?.[0] || null;
  const totalVisibleHotspots = heatmap?.length || 0;

  if (loading) return <AnalyticsSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#22365f] bg-gradient-to-r from-[#0f1b34] to-[#122447] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#38bdf8]">
              Operations Intelligence
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white">
              Operational Analytics
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Explore reporting trends, status distribution, and hotspot
              locations to support faster incident response and smarter planning.
            </p>
          </div>

          <button
            onClick={fetchData}
            className="rounded-2xl border border-[#2a426f] bg-[#111d37] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-[#16284a]"
          >
            Refresh Analytics
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Reports"
          value={stats?.total || 0}
          tone="info"
          subtitle="All recorded incidents"
        />
        <StatCard
          label="Pending"
          value={stats?.pending || 0}
          tone="warning"
          subtitle="Awaiting review"
        />
        <StatCard
          label="Verified"
          value={stats?.verified || 0}
          tone="success"
          subtitle="Confirmed incidents"
        />
        <StatCard
          label="Removed"
          value={stats?.removed || 0}
          tone="danger"
          subtitle="Completed removals"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Incident Trend Over Time"
          subtitle="Daily volume of submitted reports."
        >
          {timeSeries.length === 0 ? (
            <EmptyCard
              title="No trend data available"
              text="Once reports are created, the system will visualize daily activity here."
            />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={timeSeries}>
                <CartesianGrid stroke="#24395f" strokeDasharray="4 4" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f1b34",
                    border: "1px solid #22365f",
                    borderRadius: "16px",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel
          title="Status Distribution"
          subtitle="Current workflow breakdown by report state."
        >
          {pieData.every((item) => item.value === 0) ? (
            <EmptyCard
              title="No status data available"
              text="Status distribution will appear after reports are added to the system."
            />
          ) : (
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={55}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={["#f59e0b", "#22c55e", "#ef4444"][index]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f1b34",
                      border: "1px solid #22365f",
                      borderRadius: "16px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                {pieData.map((item, index) => (
                  <LegendRow
                    key={item.name}
                    color={["#f59e0b", "#22c55e", "#ef4444"][index]}
                    label={item.name}
                    value={item.value}
                  />
                ))}
              </div>
            </div>
          )}
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel
          title="Hotspot Summary"
          subtitle="Top clustered coordinates with the highest report concentration."
        >
          {topHotspot ? (
            <div className="space-y-4">
              <HotspotCard
                title="Top Hotspot"
                value={`${topHotspot.latitude}, ${topHotspot.longitude}`}
                subtitle={`${topHotspot.weight} report(s) recorded at this location`}
              />
              <HotspotCard
                title="Tracked Hotspots"
                value={totalVisibleHotspots}
                subtitle="Unique coordinate clusters found in the dataset"
              />
            </div>
          ) : (
            <EmptyCard
              title="No hotspot data yet"
              text="Once multiple reports are recorded, location clusters will appear here."
            />
          )}
        </Panel>

        <Panel
          title="Top Roadkill Hotspots"
          subtitle="Highest-weight locations from the heatmap dataset."
        >
          {heatmap.length === 0 ? (
            <EmptyCard
              title="No heatmap results"
              text="The heatmap table will populate once reports with coordinates are available."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#111d37] text-sm text-slate-300">
                  <tr>
                    <th className="px-4 py-4 font-medium">Latitude</th>
                    <th className="px-4 py-4 font-medium">Longitude</th>
                    <th className="px-4 py-4 font-medium">Reports</th>
                  </tr>
                </thead>
                <tbody>
                  {heatmap.slice(0, 8).map((point, index) => (
                    <tr
                      key={index}
                      className="border-t border-[#1f3157] transition hover:bg-[#111d37]"
                    >
                      <td className="px-4 py-4 text-sm text-slate-200">
                        {point.latitude}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-200">
                        {point.longitude}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
                          {point.weight} reports
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
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

function StatCard({ label, value, subtitle, tone = "info" }) {
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
      <p className="mt-2 text-sm opacity-80">{subtitle}</p>
    </div>
  );
}

function LegendRow({ color, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#22365f] bg-[#111d37] px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className="h-3.5 w-3.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium text-slate-200">{label}</span>
      </div>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function HotspotCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-[#22365f] bg-[#111d37] p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-lg font-semibold text-white break-words">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
    </div>
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

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-red-400/20 bg-red-400/10 px-6 py-10 text-center">
      <p className="text-lg font-semibold text-red-300">
        Unable to load analytics
      </p>
      <p className="mt-2 text-sm text-red-200/90">{message}</p>
      <button
        onClick={onRetry}
        className="mt-5 rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
      >
        Retry
      </button>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 rounded-3xl bg-[#101d38]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-3xl bg-[#101d38]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-[380px] rounded-3xl bg-[#101d38]" />
        <div className="h-[380px] rounded-3xl bg-[#101d38]" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-[280px] rounded-3xl bg-[#101d38]" />
        <div className="h-[320px] rounded-3xl bg-[#101d38]" />
      </div>
    </div>
  );
}