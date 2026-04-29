import { FeaturedSport } from "@/mock/public-dashboard-mock";

type PublicFeaturedSportsProps = {
  items: FeaturedSport[];
};

export default function PublicFeaturedSports({
  items,
}: PublicFeaturedSportsProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl md:p-7">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Featured Sports
          </div>
          <h3 className="mt-2 text-2xl font-black text-white">
            Онцлох спортын төрлүүд
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Тэмцээний хамгийн сонирхолтой, идэвхтэй төрлүүдийг энд онцолж харууллаа.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {items.map((sport) => (
          <div
            key={sport.id}
            className="group overflow-hidden rounded-[26px] border border-white/10 bg-slate-900/40 transition hover:-translate-y-1 hover:border-cyan-300/30"
          >
            <div className="relative h-48 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${sport.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-[#020817]/20 to-transparent" />

              {sport.tag ? (
                <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md">
                  {sport.tag}
                </div>
              ) : null}
            </div>

            <div className="p-5">
              <h4 className="text-lg font-bold text-white">{sport.name}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {sport.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}