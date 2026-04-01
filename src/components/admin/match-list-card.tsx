import { ScheduleItem } from "@/services/api";

type MatchListCardProps = {
  matches: ScheduleItem[];
  loading: boolean;
  error: string;
  onRefresh: () => Promise<void>;
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("mn-MN");
}

export default function MatchListCard({
  matches,
  loading,
  error,
  onRefresh,
}: MatchListCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
            Schedule
          </div>
          <h2 className="mt-3 text-xl font-bold text-white">Хуваарийн жагсаалт</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Ямар тэмцээн хэзээ болохыг эндээс харна.
          </p>
        </div>

        <button
          onClick={() => void onRefresh()}
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
          Loading schedule...
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
          Одоогоор хуваарь алга.
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-black/10 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-lg font-semibold text-white">
                    {item.sport_name || item.sport_key}
                  </div>
                  <div className="mt-1 text-sm text-slate-300">
                    {item.venue || "Байршилгүй"}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {formatDateTime(item.start_at)} • {item.date_label || "-"}
                  </div>
                  {item.note ? (
                    <div className="mt-2 text-xs text-slate-300">
                      Тэмдэглэл: {item.note}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                    ID: {item.id}
                  </span>
                  {item.status ? (
                    <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                      {item.status}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}