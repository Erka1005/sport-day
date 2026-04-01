import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthUser, getAuthUser, logout } from "@/services/api";

export default function UserPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const currentUser = getAuthUser();

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser.role !== "user") {
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
        Loading public portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_25%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.14),transparent_22%),radial-gradient(circle_at_bottom,rgba(234,179,8,0.10),transparent_30%)]" />

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="mx-auto flex  items-center justify-between px-6 py-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                MMS Sports Day
              </div>
              <h1 className="mt-1 text-2xl font-black text-white">
                Public Event Portal
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Public viewer mode for general event information.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-right md:block">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-300">
                  Signed in as
                </div>
                <div className="text-sm font-semibold text-white">
                  {user.username}
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
                  Viewer Access
                </div>
                <h2 className="mt-2 text-xl font-bold text-white">
                  Read-only Event Monitor
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Draft хэсэг түр идэвхгүй байна. Дараагийн шатанд schedule,
                  standings, event info-уудыг энд холбоно.
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-200">
                Public Board Active
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-dashed border-amber-400/20 bg-amber-500/10 p-8 backdrop-blur-xl">
            <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200">
              Temporary State
            </div>
            <h3 className="mt-4 text-2xl font-bold text-white">
              Draft Viewer Disabled
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Түр хугацаанд public draft board-г унтраасан. Одоогоор roster/member
              integration хийгдэж байна.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}