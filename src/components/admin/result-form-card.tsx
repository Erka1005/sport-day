import { useEffect, useMemo, useState } from "react";
import {
  BulkSetSportResultItem,
  SportItem,
  SportResultRow,
  TeamItem,
} from "@/services/api";

type ResultFormCardProps = {
  sports: SportItem[];
  teams: TeamItem[];
  currentResults: SportResultRow[];
  loadingCurrent: boolean;
  onLoad: (sportKey: string) => Promise<void>;
  onSubmit: (
    sportKey: string,
    results: BulkSetSportResultItem[]
  ) => Promise<string>;
};

type EditableRow = {
  team_code: string;
  team_name: string;
  team_color_hex?: string | null;
  rank: number | "";
  note: string;
};

function getTeamBadgeStyle(colorHex?: string | null) {
  if (!colorHex) return { backgroundColor: "#64748b" };
  return {
    backgroundColor: colorHex,
    border: colorHex.toLowerCase() === "#ffffff" ? "1px solid #cbd5e1" : undefined,
  };
}

export default function ResultFormCard({
  sports,
  teams,
  currentResults,
  loadingCurrent,
  onLoad,
  onSubmit,
}: ResultFormCardProps) {
  const [sportKey, setSportKey] = useState("");
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!sportKey && sports.length > 0) {
      setSportKey(sports[0].key);
    }
  }, [sports, sportKey]);

  useEffect(() => {
    if (!sportKey) return;
    void onLoad(sportKey);
  }, [sportKey, onLoad]);

  useEffect(() => {
    if (!sportKey) return;

    const baseTeams = [...teams].sort((a, b) => a.code.localeCompare(b.code));

    const mapped: EditableRow[] = baseTeams.map((team) => {
      const existing = currentResults.find((x) => x.team_code === team.code);

      return {
        team_code: team.code,
        team_name: team.name,
        team_color_hex: team.color_hex,
        rank: existing?.rank ?? "",
        note: existing?.note ?? "",
      };
    });

    setRows(mapped);
  }, [teams, currentResults, sportKey]);

  const selectedSport = useMemo(
    () => sports.find((x) => x.key === sportKey) || null,
    [sports, sportKey]
  );

  function updateRow(teamCode: string, patch: Partial<EditableRow>) {
    setRows((prev) =>
      prev.map((row) =>
        row.team_code === teamCode ? { ...row, ...patch } : row
      )
    );
  }

  function autoFillByOrder() {
    setRows((prev) =>
      prev.map((row, index) => ({
        ...row,
        rank: index + 1,
      }))
    );
  }

  async function handleSubmit() {
    setError("");
    setSuccess("");

    if (!sportKey) {
      setError("Sport сонгоно уу.");
      return;
    }

    if (rows.length === 0) {
      setError("Team жагсаалт хоосон байна.");
      return;
    }

    const invalid = rows.find((row) => row.rank === "" || Number(row.rank) <= 0);
    if (invalid) {
      setError(`"${invalid.team_code}" багийн rank дутуу байна.`);
      return;
    }

    const rankValues = rows.map((row) => Number(row.rank));
    const hasDuplicate = new Set(rankValues).size !== rankValues.length;
    if (hasDuplicate) {
      setError("Давхардсан rank байж болохгүй.");
      return;
    }

    setLoading(true);

    try {
      const message = await onSubmit(
        sportKey,
        rows.map((row) => ({
          team_code: row.team_code,
          rank: Number(row.rank),
          note: row.note.trim() || null,
        }))
      );
      setSuccess(message || "Үр дүн амжилттай хадгалагдлаа.");
      await onLoad(sportKey);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Үр дүн хадгалах үед алдаа гарлаа."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="mb-5">
        <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200">
          Admin Action
        </div>
        <h2 className="mt-3 text-xl font-bold text-white">Sport Result Editor</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Нэг sport-ийн бүх багийн rank-ийг бүтнээр нь хадгална.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Sport
          </label>
          <select
            value={sportKey}
            onChange={(e) => setSportKey(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/60 focus:bg-white/15"
          >
            <option value="" className="bg-slate-900 text-white">
              Sport сонгох
            </option>
            {sports.map((sport) => (
              <option
                key={sport.id}
                value={sport.key}
                className="bg-slate-900 text-white"
              >
                {sport.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => sportKey && void onLoad(sportKey)}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            {loadingCurrent ? "Ачаалж байна..." : "Одоогийн үр дүн татах"}
          </button>

          <button
            type="button"
            onClick={autoFillByOrder}
            className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
          >
            Rank 1..N автоматаар
          </button>
        </div>

        {selectedSport ? (
          <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-slate-300">
            Засаж буй төрөл:{" "}
            <span className="font-semibold text-white">{selectedSport.name}</span>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        ) : null}

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
            Team жагсаалт олдсонгүй.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.team_code}
                className="grid gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 md:grid-cols-[1.3fr_0.7fr_1fr]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-4 w-4 rounded-full"
                    style={getTeamBadgeStyle(row.team_color_hex)}
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {row.team_name}
                    </div>
                    <div className="text-xs text-slate-400">{row.team_code}</div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-300">
                    Rank
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={row.rank}
                    onChange={(e) =>
                      updateRow(row.team_code, {
                        rank: e.target.value ? Number(e.target.value) : "",
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-300">
                    Note
                  </label>
                  <input
                    type="text"
                    value={row.note}
                    onChange={(e) =>
                      updateRow(row.team_code, { note: e.target.value })
                    }
                    placeholder="optional"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          disabled={loading || loadingCurrent || !sportKey}
          onClick={() => void handleSubmit()}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 px-4 py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(245,158,11,0.25)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Хадгалж байна..." : "Үр дүн бүтнээр хадгалах"}
        </button>
      </div>
    </div>
  );
}