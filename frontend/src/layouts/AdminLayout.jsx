import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useTheme } from "../contexts/ThemeContext";

export default function AdminLayout({ children }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-[#081225] text-slate-100" : "bg-slate-100 text-slate-900"
      }`}
    >
      <div className="flex min-h-screen">
        {/* Mobile Backdrop */}
        <div
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${
            mobileSidebarOpen
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          onClick={() => setMobileSidebarOpen(false)}
        />

        {/* Mobile / Desktop Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
        </div>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar onMenuClick={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-auto px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 xl:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}