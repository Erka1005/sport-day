import {
  ResultsDashboardResponse,
  ScheduleItem,
  SportItem,
  TeamItem,
} from "@/services/api";
import { Noto_Sans } from "next/font/google";

const notoSans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

type Props = {
  sports: SportItem[];
  teams: TeamItem[];
  schedules: ScheduleItem[];
  dashboard: ResultsDashboardResponse | null;
  loading: boolean;
};

type DerivedScheduleState =
  | "upcoming"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "unknown";

function getTeamStyle(colorHex?: string | null) {
  if (!colorHex) {
    return {
      backgroundColor: "#64748b",
      boxShadow: "0 0 0 4px rgba(255,255,255,0.05)",
    };
  }

  return {
    backgroundColor: colorHex,
    border:
      colorHex.toLowerCase() === "#ffffff" ? "1px solid #cbd5e1" : undefined,
    boxShadow: "0 0 0 4px rgba(255,255,255,0.05)",
  };
}

function formatSportKey(value?: string | null) {
  if (!value) return "Төрөлгүй";

  return value.replaceAll("_", " ").replace(/\b\w/g, (s) => s.toUpperCase());
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
    return "border-white/10 bg-white/5 text-slate-300";
  }

  return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
}

function getStatusGlowClass(item: ScheduleItem) {
  const derived = getDerivedScheduleState(item);

  if (derived === "completed") {
    return "from-white/5 to-transparent";
  }

  return "from-cyan-500/10 to-transparent";
}

function sortSchedules(items: ScheduleItem[]) {
  return [...items].sort((a, b) => {
    const aStart = deriveStartDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bStart = deriveStartDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return aStart - bStart;
  });
}

function countCompletedSchedules(items: ScheduleItem[]) {
  return items.filter((item) => getDerivedScheduleState(item) === "completed")
    .length;
}

function countOngoingSchedules(items: ScheduleItem[]) {
  return items.filter((item) => getDerivedScheduleState(item) === "ongoing")
    .length;
}

export default function PublicOverviewDashboard({
  sports,
  teams,
  schedules,
  dashboard,
  loading,
}: Props) {
  const leaderboard = dashboard?.teams || [];
  const sportBreakdown = dashboard?.sports || [];
  const sortedSchedules = sortSchedules(schedules);
  const visibleSchedules = sortedSchedules.slice(0, 8);

  const ongoingCount = countOngoingSchedules(schedules);
  const completedCount = countCompletedSchedules(schedules);

  return (
    <section className={`${notoSans.className} space-y-8`}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Төрөл"
          value={loading ? "..." : String(sports.length)}
          helper="Нийт спортын төрөл"
        />
        <StatCard
          label="Баг"
          value={loading ? "..." : String(teams.length)}
          helper="Оролцож буй багууд"
        />
        <StatCard
          label="Явагдаж буй"
          value={loading ? "..." : String(ongoingCount)}
          helper="Одоогоор тоглогдож байна"
        />
        <StatCard
          label="Дууссан"
          value={loading ? "..." : String(completedCount)}
          helper="Цаг нь дууссан тоглолт"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title="Нийт Leaderboard"
          subtitle="Багуудын нийлбэр оноо, эзэлж буй байрлал"
          rightContent={
            <Badge>{loading ? "..." : `${leaderboard.length} баг`}</Badge>
          }
        >
          {loading ? (
            <EmptyState text="Leaderboard ачаалж байна..." />
          ) : leaderboard.length === 0 ? (
            <EmptyState text="Leaderboard мэдээлэл алга." />
          ) : (
            <div className="space-y-3">
              {leaderboard.map((row, index) => (
                <div
                  key={row.team_code}
                  className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-4 transition hover:border-cyan-400/20 hover:bg-white/[0.06]"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(34,211,238,0.08),transparent_32%)]" />
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/10 text-sm font-black text-cyan-200">
                        #{index + 1}
                      </div>

                      <span
                        className="inline-block h-5 w-5 rounded-full"
                        style={getTeamStyle(row.team_color_hex)}
                      />

                      <div>
                        <div className="text-sm font-bold text-white md:text-base">
                          {row.team_name}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                          {row.team_code}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Нийт оноо
                      </div>
                      <div className="mt-1 text-xl font-black text-cyan-200">
                        {row.total_score}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Ойрын хуваарь"
          subtitle="Цаг нь дууссан бол автоматаар Дууссан гэж харагдана"
          rightContent={
            <Badge>{loading ? "..." : `${visibleSchedules.length} хуваарь`}</Badge>
          }
        >
          {loading ? (
            <EmptyState text="Хуваарь ачаалж байна..." />
          ) : visibleSchedules.length === 0 ? (
            <EmptyState text="Хуваарь алга." />
          ) : (
            <div className="space-y-4">
              {visibleSchedules.map((item) => {
                const sportTitle = item.sport_name || formatSportKey(item.sport_key);
                const statusLabel = formatScheduleStatus(item);
                const statusClass = getStatusClass(item);
                const glowClass = getStatusGlowClass(item);

                return (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-4 transition hover:border-cyan-400/20 hover:bg-white/[0.06]"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${glowClass}`} />
                    <div className="relative">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-base font-bold text-white">
                              {sportTitle}
                            </div>
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold ${statusClass}`}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                            <div className="rounded-xl border border-white/8 bg-slate-950/40 px-3 py-2">
                              <span className="text-slate-400">Огноо:</span>{" "}
                              {formatScheduleDate(item)}
                            </div>
                            <div className="rounded-xl border border-white/8 bg-slate-950/40 px-3 py-2">
                              <span className="text-slate-400">Цаг:</span>{" "}
                              {formatScheduleTime(item)}
                            </div>
                            <div className="rounded-xl border border-white/8 bg-slate-950/40 px-3 py-2 sm:col-span-2">
                              <span className="text-slate-400">Байршил:</span>{" "}
                              {item.venue || "-"}
                            </div>
                          </div>

                          {item.note ? (
                            <div className="mt-3 rounded-xl border border-white/8 bg-slate-950/30 px-3 py-2 text-sm text-slate-300">
                              <span className="font-semibold text-slate-200">
                                Тэмдэглэл:
                              </span>{" "}
                              {item.note}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Sport бүрийн үр дүн"
        subtitle="Багуудын байр, оноог төрөл тус бүрээр нь харуулна"
        rightContent={
          <Badge>{loading ? "..." : `${sportBreakdown.length} төрөл`}</Badge>
        }
      >
        {loading ? (
          <EmptyState text="Sport results ачаалж байна..." />
        ) : sportBreakdown.length === 0 ? (
          <EmptyState text="Sport results мэдээлэл алга." />
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {sportBreakdown.map((sport) => (
              <div
                key={sport.sport_key}
                className="overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04]"
              >
                <div className="border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent px-5 py-4">
                  <div className="text-lg font-black text-white">
                    {sport.sport_name}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                    {sport.sport_key}
                  </div>
                </div>

                <div className="space-y-2 p-4">
                  {sport.results.map((row) => (
                    <div
                      key={`${sport.sport_key}-${row.team_code}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="inline-block h-5 w-5 rounded-full"
                          style={getTeamStyle(row.team_color_hex)}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">
                            {row.team_name}
                          </div>
                          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            {row.team_code}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                          Байр: {row.rank}
                        </span>
                        <span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                          Оноо: {row.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </section>
  );
}

function Panel({
  title,
  subtitle,
  children,
  rightContent,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightContent?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-black text-white">{title}</h3>
          {subtitle ? (
            <p className="mt-1 text-sm leading-6 text-slate-300">{subtitle}</p>
          ) : null}
        </div>
        {rightContent ? <div>{rightContent}</div> : null}
      </div>

      <div className="p-5 md:p-6">{children}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 to-transparent" />
      <div className="relative">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          {label}
        </div>
        <div className="mt-3 text-3xl font-black text-white">{value}</div>
        {helper ? (
          <div className="mt-2 text-sm leading-6 text-slate-300">{helper}</div>
        ) : null}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
      {children}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center">
      <div className="mx-auto max-w-md">
        <div className="text-lg font-semibold text-white">{text}</div>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Мэдээлэл орж ирэхэд энэ хэсэг автоматаар шинэчлэгдэнэ.
        </p>
      </div>
    </div>
  );
}