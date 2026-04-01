export type AdminSection =
  | "overview"
  | "sports"
  | "schedule"
  | "results"
  | "standings"
  | "roster"
  | "draft";

type AdminSidebarProps = {
  activeSection: AdminSection;
  onChange: (section: AdminSection) => void;
};

const items: { key: AdminSection; label: string; desc: string }[] = [
  {
    key: "overview",
    label: "Ерөнхий хяналт",
    desc: "Нийт мэдээлэл, тойм, хурдан харагдац",
  },
  {
    key: "sports",
    label: "Төрлүүд",
    desc: "Тэмцээний төрлүүд үүсгэх, харах",
  },
  {
    key: "schedule",
    label: "Хуваарь",
    desc: "Ямар тэмцээн хэзээ болохыг удирдах",
  },
  {
    key: "results",
    label: "Үр дүн оруулах",
    desc: "Sport бүрийн rank-ийг бүтнээр хадгалах",
  },
  {
    key: "standings",
    label: "Standings",
    desc: "Нийлбэр дүн, leaderboard, breakdown",
  },
  {
    key: "roster",
    label: "Бүрэлдэхүүн",
    desc: "Leader, member удирдах",
  },
  {
    key: "draft",
    label: "Драфт",
    desc: "Pool, choose, confirm",
  },
];

export default function AdminSidebar({
  activeSection,
  onChange,
}: AdminSidebarProps) {
  return (
    <aside className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
      <div className="mb-4 px-2">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
          Цэс
        </div>
        <h2 className="mt-2 text-lg font-bold text-white">Админ удирдлага</h2>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const active = activeSection === item.key;

          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                active
                  ? "border-cyan-400/30 bg-cyan-400/15 shadow-[0_10px_30px_rgba(6,182,212,0.15)]"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="text-sm font-semibold text-white">{item.label}</div>
              <div className="mt-1 text-xs leading-5 text-slate-300">{item.desc}</div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}