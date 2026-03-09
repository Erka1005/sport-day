// components/dashboard-card.tsx

type DashboardCardProps = {
  title: string;
  description: string;
  tag?: string;
};

export default function DashboardCard({
  title,
  description,
  tag,
}: DashboardCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/15">
      {tag ? (
        <div className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
          {tag}
        </div>
      ) : null}

      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}