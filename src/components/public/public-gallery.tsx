import { GalleryItem } from "@/mock/public-dashboard-mock";

type PublicGalleryProps = {
  items: GalleryItem[];
};

export default function PublicGallery({ items }: PublicGalleryProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl md:p-7">
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
          Gallery
        </div>
        <h3 className="mt-2 text-2xl font-black text-white">Онцлох агшнууд</h3>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          Тэмцээний уур амьсгал, багийн эрч хүч, шагнал гардуулах мөчүүдийн
          дүрслэлүүд.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group overflow-hidden rounded-3xl border border-white/10 bg-white/4 transition hover:border-cyan-400/20"
          >
            <div className="relative h-56 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${item.image})` }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.08),rgba(7,17,31,0.86))]" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="text-sm font-semibold text-white">{item.title}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}