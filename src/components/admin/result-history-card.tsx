type ResultHistoryItem = {
  id: string;
  sportKey: string;
  sportName: string;
  savedAt: string;
  count: number;
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
        <h2 className="mt-3 text-xl font-bold text-white">Saved Result History</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Энэ session дээр admin ямар sport-ийн үр дүн хадгалсныг харуулна.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
          Одоогоор хадгалсан үр дүн алга.
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
                    {item.sportName}
                  </div>
                  <div className="mt-1 text-sm text-slate-300">
                    key: {item.sportKey} • {item.count} баг
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {item.savedAt}
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