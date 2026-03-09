// pages/login.tsx

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getAuthUser, loginApi, saveAuthUser } from "@/services/api";

const floatingStats = [
  { label: "Teams", value: "8" },
  { label: "Participants", value: "240+" },
  { label: "Activities", value: "08" },
];

const highlights = [
  "Fast access to the event portal",
  "Verified member-only sign in",
  "Secure access to your personal dashboard",
];

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentGreeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    const existingUser = getAuthUser();
    if (existingUser) {
      router.replace("/");
    }
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginApi({ username, password });

      if (!["user", "admin", "captain"].includes(user.role)) {
        throw new Error("Unknown access profile returned from server.");
      }

      saveAuthUser(user);
      router.replace("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong while signing in.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.20),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(234,179,8,0.14),transparent_30%)]" />

      <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="absolute -left-16 top-16 h-72 w-72 animate-pulse rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -right-10 top-1/3 h-80 w-80 animate-pulse rounded-full bg-emerald-500/20 blur-3xl [animation-delay:400ms]" />
      <div className="absolute bottom-[-60px] left-1/3 h-72 w-72 animate-pulse rounded-full bg-yellow-400/10 blur-3xl [animation-delay:800ms]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <section className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:w-[56%] lg:px-14">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200 backdrop-blur-md">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              MMS Sports Day Portal
            </div>

            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              {currentGreeting},
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-white to-emerald-300 bg-clip-text text-transparent">
                Welcome to MMS Sports Day
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Access schedules, updates, team information, and personalized event
              features through the official MMS Sports Day web portal.
            </p>

            <div className="mt-8 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
              {floatingStats.map((item, index) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/15"
                  style={{
                    animation: `fadeUp 0.7s ease ${index * 0.12}s both`,
                  }}
                >
                  <div className="text-2xl font-extrabold text-white">
                    {item.value}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-300">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3">
              {highlights.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-slate-200"
                  style={{
                    animation: `slideIn 0.7s ease ${0.2 + index * 0.12}s both`,
                  }}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/15 text-emerald-300">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 hidden gap-4 md:grid md:max-w-2xl md:grid-cols-3">
              <PortalMiniCard title="Schedules" sub="Live event flow" accent="cyan" />
              <PortalMiniCard title="Updates" sub="Latest announcements" accent="emerald" />
              <PortalMiniCard title="Access" sub="Private member area" accent="amber" />
            </div>
          </div>
        </section>

        <section className="flex w-full items-center justify-center px-5 py-8 sm:px-8 lg:w-[44%] lg:px-10">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-0 scale-105 rounded-[32px] bg-gradient-to-br from-cyan-500/20 via-transparent to-emerald-500/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-[30px] border border-white/15 bg-white/10 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03),rgba(255,255,255,0.06))]" />

              <div className="relative">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                      Private Entry
                    </div>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                      Sign In
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Enter your credentials to continue to the MMS Sports Day portal.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-right backdrop-blur-md">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-slate-300">
                      Status
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                      Active
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Username
                    </label>
                    <div className="group rounded-2xl border border-white/10 bg-white/10 px-4 py-3 transition focus-within:border-cyan-400/60 focus-within:bg-white/15">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Password
                    </label>
                    <div className="group rounded-2xl border border-white/10 bg-white/10 px-4 py-3 transition focus-within:border-emerald-400/60 focus-within:bg-white/15">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="text-xs text-slate-300">
                      Access is assigned automatically after verification.
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-medium text-slate-200">
                      Verified access
                    </div>
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 shadow-inner">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 px-4 py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(6,182,212,0.25)] transition duration-300 hover:scale-[1.01] hover:shadow-[0_18px_40px_rgba(16,185,129,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="absolute inset-0 translate-x-[-120%] bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.35),transparent)] transition duration-1000 group-hover:translate-x-[120%]" />
                    <span className="relative flex items-center gap-3">
                      {loading ? (
                        <>
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_16px_rgba(255,255,255,0.95)]" />
                          Sign In
                        </>
                      )}
                    </span>
                  </button>
                </form>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <InfoPill title="Portal" desc="Private" />
                  <InfoPill title="Access" desc="Verified" />
                  <InfoPill title="Event" desc="Live" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-14px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

function PortalMiniCard({
  title,
  sub,
  accent,
}: {
  title: string;
  sub: string;
  accent: "cyan" | "emerald" | "amber";
}) {
  const accentMap: Record<typeof accent, string> = {
    cyan: "from-cyan-400/30 to-cyan-500/5 border-cyan-300/20 text-cyan-200",
    emerald:
      "from-emerald-400/30 to-emerald-500/5 border-emerald-300/20 text-emerald-200",
    amber: "from-amber-400/30 to-amber-500/5 border-amber-300/20 text-amber-200",
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-4 backdrop-blur-md ${accentMap[accent]}`}
    >
      <div className="text-sm font-bold uppercase tracking-[0.18em]">{title}</div>
      <div className="mt-2 text-sm text-slate-200">{sub}</div>
    </div>
  );
}

function InfoPill({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center backdrop-blur-md">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-white">
        {title}
      </div>
      <div className="mt-1 text-[11px] text-slate-300">{desc}</div>
    </div>
  );
}