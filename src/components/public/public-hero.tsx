import { motion } from "framer-motion";
import { HeroSlide } from "@/mock/public-dashboard-mock";

type PublicHeroProps = {
  slides: HeroSlide[];
  onScheduleClick?: () => void;
};

export default function PublicHero({ slides, onScheduleClick }: PublicHeroProps) {
  const primarySlide = slides?.[0];

  if (!primarySlide) return null;

  const heroImage = primarySlide.image ?? "/images/cover.png";

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#07111f] shadow-[0_30px_100px_rgba(0,0,0,0.45)] md:rounded-[36px]">
      {/* Desktop */}
      <div
        className="hidden min-h-[620px] bg-cover bg-left bg-no-repeat md:block"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="relative min-h-[620px]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,17,31,0.02)_0%,rgba(7,17,31,0.05)_45%,rgba(7,17,31,0.78)_68%,rgba(7,17,31,0.96)_100%)]" />

          <div className="relative z-10 flex min-h-[620px] items-center justify-end p-10">
            <InfoCard
              primarySlide={primarySlide}
              onScheduleClick={onScheduleClick}
            />
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <img
          src={heroImage}
          alt={primarySlide.title ?? "MMS Sports Cup"}
          className="h-auto w-full object-contain"
        />

        <div className="border-t border-white/10 p-4">
          <InfoCard
            primarySlide={primarySlide}
            onScheduleClick={onScheduleClick}
          />
        </div>
      </div>
    </section>
  );
}

function InfoCard({
  primarySlide,
  onScheduleClick,
}: {
  primarySlide: HeroSlide;
  onScheduleClick?: () => void;
}) {
  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-[26px] border border-white/15 bg-black/35 p-5 shadow-2xl backdrop-blur-xl md:rounded-[30px] md:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),transparent_35%,rgba(34,211,238,0.08))]" />

      <p className="relative mt-2 text-right text-3xl font-bold uppercase tracking-[0.40em] text-cyan-200">
        {primarySlide.subtitle}
      </p>

      <p className="relative mt-4 text-sm leading-7 text-white/70">
        {primarySlide.description}
      </p>

      <div className="relative mt-7 flex flex-wrap gap-3">
        <motion.button
          type="button"
          onClick={onScheduleClick}
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.96 }}
          className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100"
        >
          {primarySlide.ctaLabel ?? "Хуваарь харах"}
        </motion.button>

        <motion.a
          href="http://10.10.90.78/pictures"
          target="_blank"
          rel="noreferrer"
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.96 }}
          className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15"
        >
          Зураг үзэх
        </motion.a>
      </div>
    </div>
  );
}