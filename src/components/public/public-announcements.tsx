import { AnnouncementItem } from "@/mock/public-dashboard-mock";

type PublicAnnouncementsProps = {
  items: AnnouncementItem[];
};

export default function PublicAnnouncements({
  items,
}: PublicAnnouncementsProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl md:p-7">
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
          Announcements
        </div>
        <h3 className="mt-2 text-2xl font-black text-white">
          Чухал мэдээллүүд
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/6 to-transparent" />
            <div className="relative">
              <div className="text-base font-bold text-white">{item.title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}