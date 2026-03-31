import { useEffect, useState } from "react";
import { DraftMyTeamResponse, getMyDraftTeamApi } from "@/services/api";

type Props = {
  userId: number;
};

function formatSportKey(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (s) => s.toUpperCase());
}

export default function MyTeamCard({ userId }: Props) {
  const [data, setData] = useState<DraftMyTeamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMyTeam() {
    setLoading(true);
    setError("");

    try {
      const result = await getMyDraftTeamApi(userId);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "My team татах үед алдаа гарлаа."
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMyTeam();
  }, [userId]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
            Captain View
          </div>
          <h2 className="mt-3 text-xl font-bold text-white">My Team Roster</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Draft flow түр хаалттай. Одоогоор өөрийн багийн roster-оо ангиллаар нь
            харуулж байна.
          </p>
        </div>

        <button
          onClick={() => void loadMyTeam()}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
          Loading my team...
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
          Багийн мэдээлэл олдсонгүй.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">
            Team Code: <span className="font-bold text-white">{data.team_code}</span>
          </div>

          {data.categories.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
              Одоогоор roster хоосон байна.
            </div>
          ) : (
            data.categories.map((category) => (
              <div
                key={category.sport_key}
                className="rounded-3xl border border-white/10 bg-black/10 p-5"
              >
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {formatSportKey(category.sport_key)}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      key: {category.sport_key}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {typeof category.filled === "number" ? (
                      <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                        Filled: {category.filled}
                      </span>
                    ) : null}
                    {typeof category.quota === "number" ? (
                      <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                        Quota: {category.quota}
                      </span>
                    ) : null}
                  </div>
                </div>

                {category.players.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-5 text-sm text-slate-300">
                    Энэ sport дээр одоогоор хүн алга.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {category.players.map((player) => (
                      <div
                        key={`${category.sport_key}-${player.employee_name}`}
                        className="rounded-2xl border border-white/10 bg-slate-900/50 p-4"
                      >
                        <div className="flex items-center gap-3">
                          {player.photo_url ? (
                            <img
                              src={player.photo_url}
                              alt={player.employee_name}
                              className="h-16 w-16 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-700 text-xs text-slate-300">
                              No Photo
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-white">
                              {player.employee_name}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                              {player.is_leader ? (
                                <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                                  ⭐ Leader
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full border border-slate-400/20 bg-slate-400/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200">
                                  Member
                                </span>
                              )}

                              {typeof player.round_no === "number" ? (
                                <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
                                  Round {player.round_no}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}