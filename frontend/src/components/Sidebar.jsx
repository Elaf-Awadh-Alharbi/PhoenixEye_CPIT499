import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logo.png";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: "◫" },
  { to: "/reports", label: "Reports", icon: "▣" },
  { to: "/drones", label: "Drones", icon: "✦" },
  { to: "/analytics", label: "Analytics", icon: "◌" },
];

export default function Sidebar({ onNavigate }) {
  const location = useLocation();
  const { user } = useAuth();

  const linkClass = (path) =>
    [
      "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
      location.pathname.startsWith(path)
        ? "bg-emerald-400 text-slate-950 shadow-[0_0_0_1px_rgba(16,185,129,0.15),0_12px_30px_rgba(16,185,129,0.25)]"
        : "text-slate-300 hover:bg-[#132445] hover:text-white",
    ].join(" ");

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-[#1f3157] bg-[#0c1730] px-4 py-5 sm:px-5 sm:py-6">
      <div className="mb-6 flex flex-col items-start sm:mb-8">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-[#2a3f6c] bg-white p-2 shadow-[0_10px_30px_rgba(2,8,23,0.35)] sm:h-24 sm:w-24">
          <img
            src={logo}
            alt="Phoenix Eye"
            className="h-full w-full object-contain"
          />
        </div>

        <div className="mt-4">
          <p className="text-[1.5rem] font-bold leading-tight text-emerald-300 sm:text-[1.9rem]">
            Phoenix Eye
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Smart Operations
            <br />
            Console
          </p>
        </div>
      </div>

      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={linkClass(item.to)}
            onClick={onNavigate}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-sm">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto rounded-3xl border border-[#233a65] bg-[#101d38] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Active Session
        </p>
        <p className="mt-2 truncate text-sm font-semibold text-slate-100">
          {user?.name || "PhoenixEye Admin"}
        </p>
        <p className="truncate text-xs text-slate-400">
          {user?.email || "admin@phoenixeye.com"}
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">
            Control Center Online
          </span>
        </div>
      </div>
    </aside>
  );
}