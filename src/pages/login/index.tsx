// pages/login.tsx

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Noto_Sans } from "next/font/google";
import { AuthUser, getAuthUser, loginApi, saveAuthUser } from "@/services/api";

const notoSans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const floatingStats = [
  { label: "Баг", value: "8" },
  { label: "Оролцогч", value: "240+" },
  { label: "Төрөл", value: "08" },
];

const highlights = [
  "Тэмцээний портал руу хурдан нэвтрэх боломж",
  "Баталгаажсан хэрэглэгчийн нэвтрэлт",
  "Хувийн самбартаа аюулгүй хандах боломж",
];

const DEFAULT_PUBLIC_USER: AuthUser = {
  user_id: 0,
  username: "Хэрэглэгч",
  role: "user",
};

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState("");

  const currentGreeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Өглөөний мэнд";
    if (hour < 18) return "Өдрийн мэнд";
    return "Оройн мэнд";
  }, []);

  useEffect(() => {
    const existingUser = getAuthUser();
    if (existingUser) {
      router.replace("/");
    }
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginApi({ username, password });

      if (!["user", "admin", "captain"].includes(user.role)) {
        throw new Error("Серверээс үл мэдэгдэх эрхийн төрөл буцаж ирлээ.");
      }

      saveAuthUser(user);
      router.replace("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Нэвтрэх үед алдаа гарлаа.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGuestAccess() {
    setError("");
    setGuestLoading(true);

    try {
      saveAuthUser(DEFAULT_PUBLIC_USER);
      await router.replace("/user");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Нийтийн хандалт нээх үед алдаа гарлаа.";
      setError(message);
    } finally {
      setGuestLoading(false);
    }
  }

  return (
    <div
      className={`${notoSans.className} relative min-h-screen overflow-hidden bg-[#07111f] text-white`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.20),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(234,179,8,0.14),transparent_30%)]" />

      <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="absolute -left-16 top-16 h-72 w-72 animate-pulse rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -right-10 top-1/3 h-80 w-80 animate-pulse rounded-full bg-emerald-500/20 blur-3xl [animation-delay:400ms]" />
      <div className="absolute bottom-[-60px] left-1/3 h-72 w-72 animate-pulse rounded-full bg-yellow-400/10 blur-3xl [animation-delay:800ms]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <section className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:w-[56%] lg:px-14">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-cyan-200 backdrop-blur-md">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              MMS Спорт Өдөрлөг Портал
            </div>

            <h1 className="text-lg font-black leading-tight sm:text-5xl lg:text-4xl">
              {currentGreeting},
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-white to-emerald-300 bg-clip-text text-transparent">
                MMS Спорт Өдөрлөгийн албан ёсны вэб портал д тавтай морилно уу!
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Албан ёсны MMS Sports Day вэб порталаар дамжуулан хуваарь, мэдээ,
              багийн мэдээлэл болон хувь хэрэглэгчийн боломжууддаа хандаарай.
            </p>

            <div className="mt-8 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
              {floatingStats.map((item, index) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/15"
                  style={{
                    animation: `fadeUp 0.7s ease ${index * 0.12}s both`,
                  }}
                >
                  <div className="text-2xl font-extrabold text-white">
                    {item.value}
                  </div>
                  <div className="mt-1 text-xs tracking-[0.12em] text-slate-300">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3">
              {highlights.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-slate-200"
                  style={{
                    animation: `slideIn 0.7s ease ${0.2 + index * 0.12}s both`,
                  }}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/15 text-emerald-300">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 hidden gap-4 md:grid md:max-w-2xl md:grid-cols-3">
              <PortalMiniCard
                title="Хуваарь"
                sub="Тэмцээний явц"
                accent="cyan"
              />
              <PortalMiniCard
                title="Мэдээлэл"
                sub="Сүүлийн зарлал"
                accent="emerald"
              />
              <PortalMiniCard
                title="Хандалт"
                sub="Хувийн бүс"
                accent="amber"
              />
            </div>
          </div>
        </section>

        <section className="flex w-full items-center justify-center px-5 py-8 sm:px-8 lg:w-[44%] lg:px-10">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-0 scale-105 rounded-[32px] bg-gradient-to-br from-cyan-500/20 via-transparent to-emerald-500/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-[30px] border border-white/15 bg-white/10 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03),rgba(255,255,255,0.06))]" />

              <div className="relative">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold tracking-[0.14em] text-cyan-200">
                      Хувийн нэвтрэх хэсэг
                    </div>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                      Нэвтрэх
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Админ болон багийн ахлагчийн эрхтэй хэрэглэгчид эндээс
                      нэвтэрнэ. Энгийн хэрэглэгчид доороос шууд үргэлжлүүлж болно.
                    </p>
                  </div>

                 
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Хэрэглэгчийн нэр
                    </label>
                    <div className="group rounded-2xl border border-white/10 bg-white/10 px-4 py-3 transition focus-within:border-cyan-400/60 focus-within:bg-white/15">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Админ эсвэл ахлагчийн нэрээ оруулна уу"
                        className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Нууц үг
                    </label>
                    <div className="group rounded-2xl border border-white/10 bg-white/10 px-4 py-3 transition focus-within:border-emerald-400/60 focus-within:bg-white/15">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Нууц үгээ оруулна уу"
                        className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="text-xs text-slate-300">
                      Зочин хэрэглэгчид нэвтрэхгүйгээр үргэлжлүүлж болно.
                    </div>
                  
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 shadow-inner">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading || guestLoading}
                    className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 px-4 py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(6,182,212,0.25)] transition duration-300 hover:scale-[1.01] hover:shadow-[0_18px_40px_rgba(16,185,129,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="absolute inset-0 translate-x-[-120%] bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.35),transparent)] transition duration-1000 group-hover:translate-x-[120%]" />
                    <span className="relative flex items-center gap-3">
                      {loading ? (
                        <>
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Нэвтэрч байна...
                        </>
                      ) : (
                        <>
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_16px_rgba(255,255,255,0.95)]" />
                          Нэвтрэх
                        </>
                      )}
                    </span>
                  </button>
                </form>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs tracking-[0.14em] text-slate-400">
                    эсвэл
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <button
                  type="button"
                  onClick={handleGuestAccess}
                  disabled={guestLoading || loading}
                  className="flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {guestLoading ? (
                    <span className="flex items-center gap-3">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Зочин хэрэглэгчээр нэвтрэх...
                    </span>
                  ) : (
                    "Зочин хэрэглэгчээр үргэлжлүүлэх"
                  )}
                </button>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <InfoPill title="Портал" desc="Нийтэд" />
                  <InfoPill title="Хандалт" desc="Зочин" />
                  <InfoPill title="Тэмцээн" desc="Идэвхтэй" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-14px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

function PortalMiniCard({
  title,
  sub,
  accent,
}: {
  title: string;
  sub: string;
  accent: "cyan" | "emerald" | "amber";
}) {
  const accentMap: Record<typeof accent, string> = {
    cyan: "from-cyan-400/30 to-cyan-500/5 border-cyan-300/20 text-cyan-200",
    emerald:
      "from-emerald-400/30 to-emerald-500/5 border-emerald-300/20 text-emerald-200",
    amber: "from-amber-400/30 to-amber-500/5 border-amber-300/20 text-amber-200",
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-4 backdrop-blur-md ${accentMap[accent]}`}
    >
      <div className="text-sm font-bold tracking-[0.14em]">{title}</div>
      <div className="mt-2 text-sm text-slate-200">{sub}</div>
    </div>
  );
}

function InfoPill({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center backdrop-blur-md">
      <div className="text-xs font-bold tracking-[0.12em] text-white">
        {title}
      </div>
      <div className="mt-1 text-[11px] text-slate-300">{desc}</div>
    </div>
  );
}