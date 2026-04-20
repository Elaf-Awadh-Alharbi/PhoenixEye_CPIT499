import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { getImageUrl } from "../../utils/imageUrl";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [assignableDrones, setAssignableDrones] = useState([]);
  const [selectedDrone, setSelectedDrone] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    const res = await api.get(`/admin/reports/${id}`);
    return res.data;
  };

  const fetchAssignableDrones = async () => {
    const res = await api.get("/admin/drones");
    return (res.data || []).filter(
      (d) => d.is_online === true && d.status === "AVAILABLE"
    );
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const [reportData, drones] = await Promise.all([
        fetchReport(),
        fetchAssignableDrones(),
      ]);

      setReport(reportData);
      setAssignableDrones(drones);
      setSelectedDrone("");

      if (reportData?.ai_result_json) {
        setAiResult({
          success: reportData.ai_result_json?.success ?? true,
          total_detections: reportData.ai_total_detections ?? 0,
          max_confidence: reportData.ai_max_confidence ?? null,
          detections: reportData.ai_result_json?.detections || [],
          annotated_image_base64: reportData.ai_annotated_image_base64 || null,
          top_label: reportData.ai_top_label || null,
        });
      } else {
        setAiResult(null);
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (status) => {
    try {
      setActionLoading(true);
      await api.patch(`/admin/reports/${id}/status`, { status });
      await load();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const assignToDrone = async () => {
    if (!selectedDrone) {
      alert("Choose a drone first");
      return;
    }

    try {
      setActionLoading(true);
      await api.patch(`/admin/reports/${id}/status`, {
        status: "ASSIGNED",
        drone_id: selectedDrone,
      });
      await load();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to assign report");
    } finally {
      setActionLoading(false);
    }
  };

  const analyzeWithAI = async () => {
    try {
      setAiLoading(true);

      const res = await api.post(`/admin/reports/${id}/ai-detect`);
      setAiResult(res.data.result);
      await load();
    } catch (err) {
      alert(err?.response?.data?.error || "AI analysis failed");
    } finally {
      setAiLoading(false);
    }
  };

  const timeline = useMemo(() => {
    const order = ["PENDING", "VERIFIED", "ASSIGNED", "REMOVED"];
    const currentIndex = order.indexOf(report?.status);

    return order.map((step, index) => ({
      step,
      done: currentIndex >= index,
      active: currentIndex === index,
    }));
  }, [report]);

  if (loading) return <DetailsSkeleton />;
  if (error) return <ErrorState message={error} onBack={() => navigate(-1)} />;
  if (!report) return null;

  const dateStr = report.createdAt || report.created_at;
  const dateLabel = dateStr ? new Date(dateStr).toLocaleString() : "—";

  const canVerifyOrRemove = report.status === "PENDING";
  const canAssign = report.status === "PENDING" || report.status === "VERIFIED";

  const totalDetections = aiResult?.total_detections || 0;
  const maxConfidenceValue =
    typeof aiResult?.max_confidence === "number"
      ? Math.max(0, Math.min(100, Math.round(aiResult.max_confidence * 100)))
      : null;

  const firstDetection = aiResult?.detections?.[0] || null;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="rounded-2xl border border-[#2a426f] bg-[#111d37] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-[#16284a]"
      >
        ← Back to Reports
      </button>

      <section className="rounded-3xl border border-[#22365f] bg-gradient-to-r from-[#0f1b34] to-[#122447] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#38bdf8]">
              Incident Detail View
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white">
              Report #{report.id.slice(0, 8)}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Review report evidence, inspect location data, assign a response
              drone, and run AI-assisted image analysis.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <SourceBadge source={report.source} />
            <StatusBadge status={report.status} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Panel
            title="Incident Evidence"
            subtitle="Uploaded visual proof for this report."
          >
            {report.image_url ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-3xl ring-1 ring-white/10 bg-black">
                  <img
                    src={
                      aiResult?.annotated_image_base64
                        ? `data:image/jpeg;base64,${aiResult.annotated_image_base64}`
                        : getImageUrl(report.image_url)
                    }
                    alt="Report"
                    className="max-h-[520px] w-full object-contain"
                  />
                </div>

                {aiResult?.annotated_image_base64 && (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
                    <p className="text-sm font-medium text-emerald-300">
                      AI overlay is active
                    </p>
                    <p className="mt-1 text-xs text-slate-300">
                      The displayed image includes YOLO detection boxes generated
                      by the AI service and restored from the database.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyCard
                title="No image available"
                text="This report was created without a displayable image."
              />
            )}
          </Panel>

          <Panel
            title="Location Map"
            subtitle="Exact coordinates where the incident was reported."
          >
            <MapContainer
              center={[report.latitude, report.longitude]}
              zoom={15}
              style={{ height: "380px", borderRadius: "18px" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[report.latitude, report.longitude]}>
                <Popup>Roadkill Report Location</Popup>
              </Marker>
            </MapContainer>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoMiniCard label="Latitude" value={report.latitude} />
              <InfoMiniCard label="Longitude" value={report.longitude} />
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title="Incident Summary"
            subtitle="Core metadata and response status."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard label="Report ID" value={report.id} />
              <InfoCard label="Reported At" value={dateLabel} />
              <InfoCard
                label="Source"
                value={<SourceBadge source={report.source} />}
              />
              <InfoCard
                label="Status"
                value={<StatusBadge status={report.status} />}
              />
              <InfoCard
                label="Coordinates"
                value={`${report.latitude}, ${report.longitude}`}
                full
              />
              <InfoCard
                label="Assigned Drone"
                value={report.drone_id || "Not assigned"}
                full
              />
            </div>
          </Panel>

          <Panel
            title="Workflow Progress"
            subtitle="Current position in the report lifecycle."
          >
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={item.step} className="flex items-center gap-4">
                  <div
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold",
                      item.active
                        ? "border-emerald-400 bg-emerald-400 text-slate-950"
                        : item.done
                        ? "border-sky-400 bg-sky-400/15 text-sky-300"
                        : "border-[#2a426f] bg-[#111d37] text-slate-400",
                    ].join(" ")}
                  >
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-medium text-white">{item.step}</p>
                    <p className="text-sm text-slate-400">
                      {item.active
                        ? "Current active stage"
                        : item.done
                        ? "Completed stage"
                        : "Upcoming stage"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Actions"
            subtitle="Verify, remove, assign, or analyze this report."
          >
            <div className="space-y-5">
              {canVerifyOrRemove && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => updateStatus("VERIFIED")}
                    className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Updating..." : "Verify Report"}
                  </button>

                  <button
                    onClick={() => updateStatus("REMOVED")}
                    className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Updating..." : "Mark as Removed"}
                  </button>
                </div>
              )}

              {canAssign && (
                <div className="rounded-2xl border border-[#22365f] bg-[#111d37] p-4">
                  <p className="text-sm font-medium text-white">
                    Assign to Drone
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Only drones that are online and currently available appear
                    below.
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <select
                      className="w-full rounded-2xl border border-[#22365f] bg-[#0f1b34] p-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                      value={selectedDrone}
                      onChange={(e) => setSelectedDrone(e.target.value)}
                      disabled={!assignableDrones.length || actionLoading}
                    >
                      <option value="">
                        {assignableDrones.length
                          ? "Select available online drone"
                          : "No available online drones"}
                      </option>

                      {assignableDrones.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={assignToDrone}
                      className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-50"
                      disabled={
                        !assignableDrones.length ||
                        !selectedDrone ||
                        actionLoading
                      }
                    >
                      {actionLoading ? "Assigning..." : "Assign"}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={analyzeWithAI}
                className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-300 transition hover:bg-sky-400/20 disabled:opacity-50"
                disabled={aiLoading}
              >
                {aiLoading ? "Analyzing with AI..." : "Analyze with AI"}
              </button>
            </div>
          </Panel>

          <Panel
            title="AI Detection Result"
            subtitle="YOLO model output based on the submitted image."
          >
            {!aiResult ? (
              <EmptyCard
                title="No AI result yet"
                text="Run AI analysis to detect roadkill objects in the image."
              />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <ResultBadge
                    tone={totalDetections > 0 ? "danger" : "success"}
                    label={
                      totalDetections > 0
                        ? "Roadkill Detected"
                        : "No Roadkill Detected"
                    }
                  />
                  <ResultBadge
                    tone={totalDetections > 0 ? "info" : "neutral"}
                    label={
                      totalDetections > 0
                        ? `${totalDetections} Detection(s)`
                        : "No Objects Found"
                    }
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-300">Max Confidence</span>
                    <span className="font-semibold text-white">
                      {maxConfidenceValue != null
                        ? `${maxConfidenceValue}%`
                        : "—"}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-[#16284a]">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all"
                      style={{ width: `${maxConfidenceValue || 0}%` }}
                    />
                  </div>
                </div>

                <InfoMiniCard
                  label="Top Label"
                  value={aiResult?.top_label || firstDetection?.label || "—"}
                />

                <InfoMiniCard
                  label="Explanation"
                  value={
                    totalDetections > 0
                      ? `Model detected ${totalDetections} object(s). Highest confidence detection is "${aiResult?.top_label || firstDetection?.label}" with ${maxConfidenceValue}% confidence.`
                      : "No detections were returned by the model."
                  }
                />

                {aiResult.detections?.length > 0 && (
                  <div className="rounded-2xl border border-[#22365f] bg-[#111d37] p-4">
                    <p className="mb-3 text-sm font-medium text-white">
                      Detection Details
                    </p>
                    <div className="space-y-3">
                      {aiResult.detections.map((det, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-[#22365f] bg-[#0f1b34] p-3"
                        >
                          <p className="text-sm font-semibold text-white">
                            {det.label}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Confidence:{" "}
                            {Math.round((det.confidence || 0) * 100)}%
                          </p>
                          <p className="mt-1 text-xs text-slate-500 break-words">
                            BBox: x1 {det.bbox?.x1?.toFixed?.(1)}, y1{" "}
                            {det.bbox?.y1?.toFixed?.(1)}, x2{" "}
                            {det.bbox?.x2?.toFixed?.(1)}, y2{" "}
                            {det.bbox?.y2?.toFixed?.(1)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>
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

function InfoCard({ label, value, full = false }) {
  return (
    <div
      className={`rounded-2xl border border-[#22365f] bg-[#111d37] p-4 ${
        full ? "sm:col-span-2" : ""
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 break-all text-sm font-medium text-white">
        {value}
      </div>
    </div>
  );
}

function InfoMiniCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#22365f] bg-[#111d37] p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-white">
        {value}
      </p>
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

function StatusBadge({ status }) {
  const colors = {
    PENDING: "bg-amber-400/15 text-amber-300",
    VERIFIED: "bg-emerald-400/15 text-emerald-300",
    ASSIGNED: "bg-sky-400/15 text-sky-300",
    REMOVED: "bg-red-400/15 text-red-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        colors[status] || "bg-slate-700 text-slate-200"
      }`}
    >
      {status}
    </span>
  );
}

function SourceBadge({ source }) {
  const styles = {
    CITIZEN: "bg-sky-400/15 text-sky-300",
    DRONE: "bg-violet-400/15 text-violet-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[source] || "bg-slate-700 text-slate-200"
      }`}
    >
      {source}
    </span>
  );
}

function ResultBadge({ label, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-700 text-slate-200",
    success: "bg-emerald-400/15 text-emerald-300",
    danger: "bg-red-400/15 text-red-300",
    info: "bg-sky-400/15 text-sky-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

function ErrorState({ message, onBack }) {
  return (
    <div className="rounded-3xl border border-red-400/20 bg-red-400/10 px-6 py-10 text-center">
      <p className="text-lg font-semibold text-red-300">
        Unable to load report
      </p>
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
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <div className="h-[420px] rounded-3xl bg-[#101d38]" />
          <div className="h-[460px] rounded-3xl bg-[#101d38]" />
        </div>
        <div className="space-y-6">
          <div className="h-[260px] rounded-3xl bg-[#101d38]" />
          <div className="h-[260px] rounded-3xl bg-[#101d38]" />
          <div className="h-[280px] rounded-3xl bg-[#101d38]" />
          <div className="h-[260px] rounded-3xl bg-[#101d38]" />
        </div>
      </div>
    </div>
  );
}
