// pages/captain.tsx

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import DraftShell from "@/components/draft/draft-shell";
import { AuthUser, getAuthUser, logout } from "@/services/api";

function getCaptainDisplayName(username: string): string {
  const normalized = username.toLowerCase().trim();

  const map: Record<string, string> = {
    captain1: "White Team Captain",
    captain2: "Yellow Team Captain",
    captain3: "Green Team Captain",
    captain4: "Red Team Captain",
    captain5: "Black Team Captain",
    captain6: "Blue Team Captain",
    captain7: "Orange Team Captain",
    captain8: "Pink Team Captain",
  };

  return map[normalized] || username;
}

function getCaptainColorClass(username: string): string {
  const normalized = username.toLowerCase().trim();

  const map: Record<string, string> = {
    captain1: "bg-white",
    captain2: "bg-yellow-500",
    captain3: "bg-green-800",
    captain4: "bg-red-500",
    captain5: "bg-black text-white border border-white/20",
    captain6: "bg-blue-500",
    captain7: "bg-orange-500",
    captain8: "bg-pink-500",
  };

  return map[normalized] || "bg-slate-400";
}

export default function CaptainPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const currentUser = getAuthUser();

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser.role !== "captain") {
      router.replace("/");
      return;
    }

    setUser(currentUser);
  }, [router]);

  const displayName = useMemo(() => {
    if (!user) return "";
    return getCaptainDisplayName(user.username);
  }, [user]);

  const colorClass = useMemo(() => {
    if (!user) return "bg-slate-400";
    return getCaptainColorClass(user.username);
  }, [user]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading captain portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_25%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.14),transparent_22%),radial-gradient(circle_at_bottom,rgba(234,179,8,0.10),transparent_30%)]" />

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                MMS Sports Day
              </div>
              <h1 className="mt-1 text-2xl font-black text-white">
                Captain Draft Hub
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Manage your draft actions and confirm player picks.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-right md:block">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-300">
                  Signed in as
                </div>

                <div className="mt-1 flex items-center justify-end gap-2">
                  <span className={`inline-block h-3 w-3 rounded-full ${colorClass}`} />
                  <span className="text-sm font-semibold text-white">
                    {displayName}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  Team Access
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <span className={`inline-block h-4 w-4 rounded-full ${colorClass}`} />
                  <h2 className="text-xl font-bold text-white">{displayName}</h2>
                </div>

                <p className="mt-1 text-sm text-slate-300">
                  You are viewing the captain portal for your assigned draft team.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200">
                Captain Access Active
              </div>
            </div>
          </div>

          <DraftShell mode="captain" user={user} />
        </main>
      </div>
    </div>
  );
}