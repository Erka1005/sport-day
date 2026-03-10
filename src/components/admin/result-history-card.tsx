// components/admin/result-history-card.tsx

type ResultHistoryItem = {
  id: string;
  matchId: number;
  scoreA: number;
  scoreB: number;
  createdAt: string;
  message: string;
};

type ResultHistoryCardProps = {
  items: ResultHistoryItem[];
};

export default function ResultHistoryCard({
  items,
}: ResultHistoryCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="mb-5">
        <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
          Recent Activity
        </div>
        <h2 className="mt-3 text-xl font-bold text-white">Submitted Results</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Recently submitted match results from this session.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
          No result submissions yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-black/10 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-lg font-semibold text-white">
                    Match #{item.matchId}
                  </div>
                  <div className="mt-1 text-sm text-slate-300">
                    Score: {item.scoreA} : {item.scoreB}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {item.createdAt}
                  </div>
                </div>

                <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                  {item.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}