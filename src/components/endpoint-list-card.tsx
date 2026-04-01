type EndpointItem = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  label: string;
};

type EndpointListCardProps = {
  title: string;
  items: EndpointItem[];
};

const methodStyles: Record<EndpointItem["method"], string> = {
  GET: "bg-sky-500/20 text-sky-200 border-sky-400/20",
  POST: "bg-emerald-500/20 text-emerald-200 border-emerald-400/20",
  PUT: "bg-amber-500/20 text-amber-200 border-amber-400/20",
  DELETE: "bg-rose-500/20 text-rose-200 border-rose-400/20",
};

export default function EndpointListCard({
  title,
  items,
}: EndpointListCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <h3 className="text-lg font-bold text-white">{title}</h3>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={`${item.method}-${item.path}`}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`inline-flex min-w-[72px] justify-center rounded-lg border px-2 py-1 text-xs font-bold ${methodStyles[item.method]}`}
              >
                {item.method}
              </span>
              <div className="min-w-0">
                <div className="truncate font-mono text-sm text-white">
                  {item.path}
                </div>
                <div className="text-xs text-slate-300">{item.label}</div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-200">
              Endpoint
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}