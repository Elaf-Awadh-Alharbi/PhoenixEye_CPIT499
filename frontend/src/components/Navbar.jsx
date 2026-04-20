import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const pageMeta = {
  "/dashboard": {
    title: "Control Center Overview",
    subtitle: "Monitor reports, drones, and system activity in real time.",
  },
  "/reports": {
    title: "Reports Management",
    subtitle: "Review incidents, verify cases, and assign field response.",
  },
  "/drones": {
    title: "Fleet Management",
    subtitle: "Track availability, battery level, and mission readiness.",
  },
  "/analytics": {
    title: "Operational Analytics",
    subtitle: "Analyze trends, verification rates, and hotspot locations.",
  },
};

export default function Navbar({ onMenuClick }) {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isDark = theme === "dark";

  const current =
    Object.entries(pageMeta).find(([path]) =>
      location.pathname.startsWith(path)
    )?.[1] || {
      title: "Phoenix Eye",
      subtitle: "Smart roadkill monitoring and response platform.",
    };

  return (
    <header
      className={`sticky top-0 z-20 border-b backdrop-blur ${
        isDark
          ? "border-[#1f3157] bg-[#0d1830]/95"
          : "border-slate-200 bg-white/95"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-3 px-4 py-3 sm:px-5 md:px-6 xl:px-8">
        <div className="flex min-w-0 items-start gap-3">
          <button
            onClick={onMenuClick}
            className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border lg:hidden ${
              isDark
                ? "border-[#263b67] bg-[#111f3c] text-slate-100"
                : "border-slate-300 bg-white text-slate-900"
            }`}
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="min-w-0">
            <p
              className={`text-[11px] font-medium uppercase tracking-[0.22em] sm:text-xs ${
                isDark ? "text-[#38bdf8]" : "text-blue-600"
              }`}
            >
              Phoenix Eye
            </p>
            <h1
              className={`truncate text-lg font-semibold sm:text-xl ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {current.title}
            </h1>
            <p
              className={`mt-1 hidden text-sm md:block ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {current.subtitle}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className={`rounded-2xl px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
              isDark
                ? "border border-[#263b67] bg-[#111f3c] text-slate-100 hover:bg-[#16284a]"
                : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
            }`}
          >
            {isDark ? "Light" : "Dark"}
          </button>

          <div
            className={`hidden rounded-2xl px-3 py-2 lg:block ${
              isDark
                ? "border border-emerald-400/20 bg-emerald-400/10"
                : "border border-emerald-200 bg-emerald-50"
            }`}
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span
                className={`font-medium ${
                  isDark ? "text-emerald-300" : "text-emerald-700"
                }`}
              >
                System Connected
              </span>
            </div>
          </div>

          <div
            className={`hidden rounded-2xl px-4 py-2 sm:block ${
              isDark
                ? "border border-[#263b67] bg-[#111f3c]"
                : "border border-slate-300 bg-white"
            }`}
          >
            <p
              className={`text-xs ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Signed in as
            </p>
            <p
              className={`max-w-[180px] truncate text-sm font-medium ${
                isDark ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {user?.email || "admin@phoenixeye.com"}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-2xl bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-400 sm:px-4 sm:text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}