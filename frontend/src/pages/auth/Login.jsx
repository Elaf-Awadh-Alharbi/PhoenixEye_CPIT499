import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../assets/logo.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const res = await api.post("/auth/login", form);
      login(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.error || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#081225] text-slate-100 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_35%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.08),transparent_35%)]" />

      <div className="relative w-full max-w-5xl grid overflow-hidden rounded-[2rem] border border-[#22365f] bg-[#0f1b34]/95 shadow-[0_25px_80px_rgba(2,8,23,0.6)] backdrop-blur xl:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden xl:flex flex-col justify-between border-r border-[#22365f] bg-gradient-to-br from-[#0f1b34] to-[#122447] p-10">
          <div>
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-[#2a3f6c] bg-white p-2 shadow-[0_10px_30px_rgba(2,8,23,0.35)]">
              <img
                src={logo}
                alt="Phoenix Eye"
                className="h-full w-full object-contain"
              />
            </div>

            <p className="mt-6 text-sm font-medium uppercase tracking-[0.22em] text-[#38bdf8]">
              Phoenix Eye
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-white">
              Smart Operations
              <br />
              Control Center
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
              Secure access to the Phoenix Eye dashboard for monitoring
              roadkill incidents, drone missions, and operational analytics.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <p className="text-sm font-semibold text-emerald-300">
              Real-time mission monitoring
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Track reports, assign drones, and analyze incidents from one
              unified command interface.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 xl:hidden">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[#2a3f6c] bg-white p-2">
                  <img
                    src={logo}
                    alt="Phoenix Eye"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-300">
                    Phoenix Eye
                  </p>
                  <p className="text-sm text-slate-400">
                    Smart Operations Console
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#38bdf8]">
                Admin Access
              </p>
              <h2 className="mt-3 text-3xl font-bold text-white">
                Sign in to continue
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Enter your credentials to access the operational dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  placeholder="admin@phoenixeye.com"
                  className="w-full rounded-2xl border border-[#22365f] bg-[#111d37] px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400"
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-[#22365f] bg-[#111d37] px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400"
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}