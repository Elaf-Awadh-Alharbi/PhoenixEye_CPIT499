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

export default function Navbar() {
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
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-8">
        <div className="min-w-0">
          <p
            className={`text-xs font-medium uppercase tracking-[0.22em] ${
              isDark ? "text-[#38bdf8]" : "text-blue-600"
            }`}
          >
            Phoenix Eye
          </p>
          <h1
            className={`truncate text-xl font-semibold ${
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

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              isDark
                ? "border border-[#263b67] bg-[#111f3c] text-slate-100 hover:bg-[#16284a]"
                : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
            }`}
          >
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>

          <div
            className={`hidden rounded-2xl px-3 py-2 md:block ${
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
            className={`rounded-2xl px-4 py-2 ${
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
            className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}