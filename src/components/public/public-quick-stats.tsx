import { motion } from "framer-motion";
import { QuickStat } from "@/mock/public-dashboard-mock";

type PublicQuickStatsProps = {
  items: QuickStat[];
};

export default function PublicQuickStats({ items }: PublicQuickStatsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.55,
            delay: index * 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          whileHover={{
            y: -8,
            scale: 1.025,
          }}
          className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl"
        >
          {/* base glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-cyan-400/8 opacity-70" />

          {/* hover shine */}
          <div className="pointer-events-none absolute inset-y-0 -left-24 w-20 rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)] blur-sm transition-transform duration-700 group-hover:translate-x-[520px]" />

          {/* floating circle */}
          <motion.div
            animate={{
              y: [0, -8, 0],
              opacity: [0.35, 0.65, 0.35],
            }}
            transition={{
              duration: 3.2 + index * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute right-4 top-4 h-16 w-15 rounded-full border border-cyan-300/15 bg-cyan-300/10 blur-[1px]"
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/80">
                {item.label}
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-xs font-black text-cyan-100 transition duration-300 group-hover:scale-110 group-hover:rotate-6">
                {index + 1}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: 0.18 + index * 0.08,
              }}
              className="mt-5 text-4xl font-black tracking-tight text-white"
            >
              {item.value}
            </motion.div>

            {item.helper ? (
              <div className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                {item.helper}
              </div>
            ) : null}
          </div>

          <div className="absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 bg-cyan-300/70 transition-transform duration-500 group-hover:scale-x-100" />
        </motion.div>
      ))}
    </section>
  );
}