// pages/captain.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DraftShell from "@/components/draft/draft-shell";
import { AuthUser, getAuthUser, logout } from "@/services/api";

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
              <h1 className="mt-1 text-2xl font-black text-white">Captain Draft Hub</h1>
              <p className="mt-1 text-sm text-slate-300">
                Choose players for your team when it is your turn.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-right md:block">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-300">
                  Signed in as
                </div>
                <div className="text-sm font-semibold text-white">{user.username}</div>
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
          <DraftShell mode="captain" user={user} />
        </main>
      </div>
    </div>
  );
}