import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import DraftShell from "@/components/draft/draft-shell";
import {
  AuthUser,
  TeamItem,
  getAuthUser,
  listTeamsApi,
  logout,
  renameMyTeamApi,
} from "@/services/api";

function getTeamColorClass(colorHex?: string | null): string {
  if (!colorHex) return "bg-slate-400";

  const normalized = colorHex.toLowerCase();

  if (normalized === "#ffffff") return "bg-white border border-slate-300";
  if (normalized === "#000000" || normalized === "#111111") {
    return "bg-black border border-white/20";
  }
  if (normalized === "#ff0000") return "bg-red-500";
  if (normalized === "#0000ff") return "bg-blue-500";
  if (normalized === "#ffff00") return "bg-yellow-400";
  if (normalized === "#008000") return "bg-green-700";
  if (normalized === "#ffa500") return "bg-orange-500";
  if (normalized === "#ffc0cb") return "bg-pink-500";

  return "bg-slate-400";
}

export default function CaptainPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [team, setTeam] = useState<TeamItem | null>(null);
  const [teamLoading, setTeamLoading] = useState(true);

  const [teamNameInput, setTeamNameInput] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [renameSuccess, setRenameSuccess] = useState("");

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

  useEffect(() => {
    if (!user) return;

    void loadCaptainTeam(user.user_id);
  }, [user]);

  async function loadCaptainTeam(userId: number) {
    setTeamLoading(true);
    setRenameError("");

    try {
      const teams = await listTeamsApi(userId);
      const myTeam =
        teams.find((item) => item.captain_user_id === userId) || null;

      setTeam(myTeam);
      setTeamNameInput(myTeam?.name || "");
    } catch (error) {
      console.error("Failed to load captain team", error);
      setTeam(null);
    } finally {
      setTeamLoading(false);
    }
  }

  async function handleRenameTeam() {
    if (!user) return;

    const trimmed = teamNameInput.trim();

    setRenameError("");
    setRenameSuccess("");

    if (!trimmed) {
      setRenameError("Team name хоосон байж болохгүй.");
      return;
    }

    if (trimmed.length < 2) {
      setRenameError("Team name хэт богино байна.");
      return;
    }

    if (team?.name?.trim() === trimmed) {
      setRenameError("Шинэ нэр нь одоогийн нэртэй ижил байна.");
      return;
    }

    setRenameLoading(true);

    try {
      const updatedTeam = await renameMyTeamApi(
        { name: trimmed },
        user.user_id,
      );

      setTeam(updatedTeam);
      setTeamNameInput(updatedTeam.name);
      setRenameSuccess("Багийн нэр амжилттай шинэчлэгдлээ.");
    } catch (err) {
      setRenameError(
        err instanceof Error ? err.message : "Багийн нэр солих үед алдаа гарлаа.",
      );
    } finally {
      setRenameLoading(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const displayName = useMemo(() => {
    if (team?.name) return `${team.name} Captain`;
    if (user?.username) return user.username;
    return "";
  }, [team, user]);

  const colorClass = useMemo(() => {
    return getTeamColorClass(team?.color_hex);
  }, [team]);

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
                  <h2 className="text-xl font-bold text-white">
                    {teamLoading
                      ? "Loading team..."
                      : team
                      ? `${team.name} Captain`
                      : user.username}
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-300">
                  {team
                    ? `You are viewing the captain portal for ${team.name} (${team.code})`
                    : "You are viewing the captain portal for your assigned draft team."}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200">
                Captain Access Active
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
                  Team Settings
                </div>
                <h2 className="mt-1 text-xl font-bold text-white">
                  Rename My Team
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Captain өөрийн багийн нэрийг эндээс өөрчилж болно.
                </p>
              </div>

              {team ? (
                <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-slate-200">
                  Current code: <span className="font-bold text-white">{team.code}</span>
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Team Name
                </label>
                <input
                  type="text"
                  value={teamNameInput}
                  onChange={(e) => setTeamNameInput(e.target.value)}
                  placeholder="Enter new team name"
                  disabled={teamLoading || renameLoading || !team}
                  className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="flex items-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTeamNameInput(team?.name || "");
                    setRenameError("");
                    setRenameSuccess("");
                  }}
                  disabled={renameLoading || teamLoading || !team}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={() => void handleRenameTeam()}
                  disabled={renameLoading || teamLoading || !team}
                  className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {renameLoading ? "Saving..." : "Save Name"}
                </button>
              </div>
            </div>

            {renameError ? (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {renameError}
              </div>
            ) : null}

            {renameSuccess ? (
              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {renameSuccess}
              </div>
            ) : null}
          </div>

          <DraftShell mode="captain" user={user} />
        </main>
      </div>
    </div>
  );
}