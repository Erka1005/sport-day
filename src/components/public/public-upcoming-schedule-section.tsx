import React from "react";
import { CalendarDays, Clock3, MapPin, Sparkles } from "lucide-react";
import { ScheduleItem } from "@/services/api";

type PublicUpcomingScheduleSectionProps = {
  schedules: ScheduleItem[];
  loading: boolean;
};

type DerivedScheduleState =
  | "upcoming"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "unknown";

type SportVisual = {
  image: string;
  label: string;
};

const DEFAULT_SPORT_VISUAL: SportVisual = {
  image: "/images/sports/chess.jpg",
  label: "Тэмцээн",
};

const SPORT_VISUALS: Record<string, SportVisual> = {
  basketball_male: {
    image: "/images/sports/basketball-male.jpg",
    label: "Эрэгтэй сагс",
  },
  basketball_female: {
    image: "/images/sports/basketball-female.jpg",
    label: "Эмэгтэй сагс",
  },
  volleyball_male: {
    image: "/images/sports/volleyball-male.jpg",
    label: "Эрэгтэй волейбол",
  },
  volleyball_female: {
    image: "/images/sports/volleyball-female.jpg",
    label: "Эмэгтэй волейбол",
  },
  table_tennis_male: {
    image: "/images/sports/tennis-male.jpg",
    label: "Эрэгтэй ширээний теннис",
  },
  table_tennis_female: {
    image: "/images/sports/tennis-female.jpg",
    label: "Эмэгтэй ширээний теннис",
  },
  tennis_male: {
    image: "/images/sports/tennis-male.jpg",
    label: "Эрэгтэй теннис",
  },
  tennis_female: {
    image: "/images/sports/tennis-female.jpg",
    label: "Эмэгтэй теннис",
  },
  darts: {
    image: "/images/sports/darts.jpg",
    label: "Дартс",
  },
  chess: {
    image: "/images/sports/chess.jpg",
    label: "Шатар",
  },
  default: DEFAULT_SPORT_VISUAL,
};

function normalize(value?: string | null) {
  if (!value) return "";
  return value.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
}

function containsAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function getGenderSuffix(name: string) {
  if (containsAny(name, ["эмэгтэй", "female", "women", "girls"])) {
    return "female";
  }

  if (containsAny(name, ["эрэгтэй", "male", "men", "boys"])) {
    return "male";
  }

  return "male";
}

function getSportVisual(item: ScheduleItem): SportVisual {
  const sportKey = normalize(item.sport_key);
  const sportName = normalize(item.sport_name);
  const combined = `${sportKey} ${sportName}`;

  if (containsAny(combined, ["дартс", "darts"])) {
    return SPORT_VISUALS.darts ?? DEFAULT_SPORT_VISUAL;
  }

  if (containsAny(combined, ["шатар", "chess"])) {
    return SPORT_VISUALS.chess ?? DEFAULT_SPORT_VISUAL;
  }

  const gender = getGenderSuffix(combined);

  if (containsAny(combined, ["сагс", "basketball", "basket_ball"])) {
    return gender === "female"
      ? SPORT_VISUALS.basketball_female ?? DEFAULT_SPORT_VISUAL
      : SPORT_VISUALS.basketball_male ?? DEFAULT_SPORT_VISUAL;
  }

  if (containsAny(combined, ["волейбол", "volleyball", "volley_ball"])) {
    return gender === "female"
      ? SPORT_VISUALS.volleyball_female ?? DEFAULT_SPORT_VISUAL
      : SPORT_VISUALS.volleyball_male ?? DEFAULT_SPORT_VISUAL;
  }

  if (
    containsAny(combined, [
      "ширээний_теннис",
      "ширээнийтеннис",
      "table_tennis",
      "tabletennis",
      "ping_pong",
      "pingpong",
    ])
  ) {
    return gender === "female"
      ? SPORT_VISUALS.table_tennis_female ?? DEFAULT_SPORT_VISUAL
      : SPORT_VISUALS.table_tennis_male ?? DEFAULT_SPORT_VISUAL;
  }

  if (containsAny(combined, ["теннис", "tennis"])) {
    return gender === "female"
      ? SPORT_VISUALS.tennis_female ?? DEFAULT_SPORT_VISUAL
      : SPORT_VISUALS.tennis_male ?? DEFAULT_SPORT_VISUAL;
  }

  return SPORT_VISUALS.default ?? DEFAULT_SPORT_VISUAL;
}

function formatSportKey(value?: string | null) {
  if (!value) return "Төрөлгүй";
  return value.replaceAll("_", " ").replace(/\b\w/g, (s) => s.toUpperCase());
}

function parseTimeString(value?: string | null) {
  if (!value) return null;

  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  return { hours, minutes };
}

function deriveStartDate(item: ScheduleItem): Date | null {
  const direct = item.start_at ? new Date(item.start_at) : null;
  if (direct && !Number.isNaN(direct.getTime())) return direct;

  const startTime = (item as ScheduleItem & { start_time?: string | null })
    .start_time;

  if (item.date_label && startTime) {
    const parsed = parseTimeString(startTime);
    if (!parsed) return null;

    const date = new Date(item.date_label);
    if (Number.isNaN(date.getTime())) return null;

    date.setHours(parsed.hours, parsed.minutes, 0, 0);
    return date;
  }

  return null;
}

function deriveEndDate(item: ScheduleItem, startDate: Date | null): Date | null {
  const endAt = (item as ScheduleItem & { end_at?: string | null }).end_at;

  if (endAt) {
    const parsed = new Date(endAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const endTime = (item as ScheduleItem & { end_time?: string | null }).end_time;
  const parsedTime = parseTimeString(endTime);

  if (startDate && parsedTime) {
    const endDate = new Date(startDate);
    endDate.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);

    if (endDate.getTime() < startDate.getTime()) {
      endDate.setDate(endDate.getDate() + 1);
    }

    return endDate;
  }

  return null;
}

function getDerivedScheduleState(item: ScheduleItem): DerivedScheduleState {
  if (item.status === "cancelled") return "cancelled";
  if (item.status === "completed") return "completed";

  const now = new Date();
  const startDate = deriveStartDate(item);
  const endDate = deriveEndDate(item, startDate);

  if (startDate && endDate) {
    if (now > endDate) return "completed";
    if (now >= startDate && now <= endDate) return "ongoing";
    if (now < startDate) return "upcoming";
  }

  if (startDate && !endDate) {
    if (now < startDate) return "upcoming";
    return "ongoing";
  }

  if (item.status === "ongoing") return "ongoing";
  if (item.status === "scheduled") return "upcoming";

  return "unknown";
}

function formatScheduleStatus(item: ScheduleItem) {
  const derived = getDerivedScheduleState(item);

  if (derived === "upcoming") return "Удахгүй";
  if (derived === "ongoing") return "Явагдаж байна";
  if (derived === "completed") return "Дууссан";
  if (derived === "cancelled") return "Цуцлагдсан";

  return "Тодорхойгүй";
}

function getStatusClass(item: ScheduleItem) {
  const derived = getDerivedScheduleState(item);

  if (derived === "completed") {
    return "border-emerald-300/30 bg-emerald-400/90 text-emerald-950 shadow-[0_0_22px_rgba(52,211,153,0.45)]";
  }

  if (derived === "ongoing") {
    return "border-cyan-200/40 bg-cyan-300/90 text-cyan-950 shadow-[0_0_22px_rgba(103,232,249,0.45)]";
  }

  if (derived === "cancelled") {
    return "border-rose-300/35 bg-rose-400/90 text-rose-950 shadow-[0_0_22px_rgba(251,113,133,0.45)]";
  }

  return "border-amber-200/40 bg-amber-300/90 text-amber-950 shadow-[0_0_22px_rgba(252,211,77,0.45)]";
}

function formatScheduleDate(item: ScheduleItem) {
  if (item.date_label) return item.date_label;

  if (item.start_at) {
    const date = new Date(item.start_at);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("mn-MN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    }

    return item.start_at;
  }

  return "-";
}

function formatScheduleTime(item: ScheduleItem) {
  const startTime =
    (item as ScheduleItem & { start_time?: string | null }).start_time ||
    (() => {
      if (!item.start_at) return null;

      const date = new Date(item.start_at);
      if (Number.isNaN(date.getTime())) return item.start_at;

      return date.toLocaleTimeString("mn-MN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    })();

  const endTime = (item as ScheduleItem & { end_time?: string | null }).end_time;

  if (startTime && endTime) return `${startTime} - ${endTime}`;
  if (startTime) return startTime;
  if (endTime) return endTime;

  return "-";
}

function sortSchedules(items: ScheduleItem[]) {
  return [...items].sort((a, b) => {
    const aStart = deriveStartDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bStart = deriveStartDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;

    return aStart - bStart;
  });
}

export default function PublicUpcomingScheduleSection({
  schedules,
  loading,
}: PublicUpcomingScheduleSectionProps) {
  const items = sortSchedules(schedules ?? []).slice(0, 8);
  const top = items.slice(0, 3);
  const middle = items.slice(3, 5);
  const bottom = items.slice(5, 8);

  return (
    <section className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl md:p-7">
      <div className="relative mb-6 overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_22%)]" />

        <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Хуваарь
            </div>

            <h2 className="mt-2 text-2xl font-bold leading-tight tracking-[-0.02em] text-white md:text-3xl">
              Удахгүй болох тоглолтууд
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Тэмцээний тоглолтуудын огноо, цаг болон байршлыг эндээс хараарай.
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
            {loading ? "..." : `${items.length} хуваарь`}
          </span>
        </div>
      </div>

      {loading ? (
        <EmptyState text="Хуваарь ачаалж байна..." />
      ) : items.length === 0 ? (
        <EmptyState text="Хуваарь алга." />
      ) : (
        <div className="space-y-5">
          {top.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {top.map((item) => (
                <CompactScheduleCard key={item.id} item={item} />
              ))}
            </div>
          ) : null}

          {middle.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {middle.map((item) => (
                <FeaturedScheduleCard key={item.id} item={item} />
              ))}
            </div>
          ) : null}

          {bottom.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {bottom.map((item) => (
                <CompactScheduleCard key={item.id} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function FeaturedScheduleCard({ item }: { item: ScheduleItem }) {
  const visual = getSportVisual(item);
  const sportTitle = item.sport_name || formatSportKey(item.sport_key);
  const statusLabel = formatScheduleStatus(item);
  const statusClass = getStatusClass(item);

  return (
    <article className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-96 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url(${visual.image})` }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.12),rgba(7,17,31,0.92))]" />

          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">
              {visual.label}
            </span>

            <span
              className={`inline-flex rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] backdrop-blur-xl ${statusClass}`}
            >
              {statusLabel}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5">
            <h3 className="text-3xl font-bold leading-tight text-white">
              {sportTitle}
            </h3>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Тэмцээний онцлох тоглолт.
            </p>
          </div>
        </div>

        <div className="space-y-4 p-5 md:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoChip
              icon={<CalendarDays className="h-4 w-4" />}
              label="Огноо"
              value={formatScheduleDate(item)}
            />

            <InfoChip
              icon={<Clock3 className="h-4 w-4" />}
              label="Цаг"
              value={formatScheduleTime(item)}
            />

            <InfoChip
              icon={<MapPin className="h-4 w-4" />}
              label="Байршил"
              value={item.venue || "-"}
              className="sm:col-span-2"
            />
          </div>

          {item.note ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
                Тэмдэглэл
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                {item.note}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function CompactScheduleCard({ item }: { item: ScheduleItem }) {
  const visual = getSportVisual(item);
  const sportTitle = item.sport_name || formatSportKey(item.sport_key);
  const statusLabel = formatScheduleStatus(item);
  const statusClass = getStatusClass(item);

  return (
    <article className="group overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
      <div className="relative h-48 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-110"
          style={{ backgroundImage: `url(${visual.image})` }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.12),rgba(7,17,31,0.90))]" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="inline-flex rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">
            {visual.label}
          </span>

          <span
            className={`inline-flex rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] backdrop-blur-xl ${statusClass}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-xl font-bold leading-tight text-white">
            {sportTitle}
          </h3>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <InfoChip
          icon={<CalendarDays className="h-4 w-4" />}
          label="Огноо"
          value={formatScheduleDate(item)}
        />

        <InfoChip
          icon={<Clock3 className="h-4 w-4" />}
          label="Цаг"
          value={formatScheduleTime(item)}
        />

        <InfoChip
          icon={<MapPin className="h-4 w-4" />}
          label="Байршил"
          value={item.venue || "-"}
          className="sm:col-span-2"
        />
      </div>
    </article>
  );
}

function InfoChip({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 ${className}`}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        <span className="text-cyan-200">{icon}</span>
        {label}
      </div>

      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center">
      <div className="text-lg font-semibold text-white">{text}</div>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        Мэдээлэл орж ирэхэд энэ хэсэг автоматаар шинэчлэгдэнэ.
      </p>
    </div>
  );
}