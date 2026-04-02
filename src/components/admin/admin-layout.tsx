// components/admin/admin-layout.tsx

import { ReactNode } from "react";
import { useRouter } from "next/router";
import { Noto_Sans } from "next/font/google";
import { logout } from "@/services/api";

const notoSans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

type AdminLayoutProps = {
  username: string;
  sidebar: ReactNode;
  children: ReactNode;
};

export default function AdminLayout({
  username,
  sidebar,
  children,
}: AdminLayoutProps) {
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div
      className={`${notoSans.className} min-h-screen bg-[#07111f] text-white`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_25%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.14),transparent_22%),radial-gradient(circle_at_bottom,rgba(234,179,8,0.10),transparent_30%)]" />

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="mx-auto flex max-w-screen items-center justify-between px-20 py-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                MMS Спорт өдөрлөг
              </div>

              <p className="mt-1 text-sm text-slate-300">
                Спортын тохиргоо болон арга хэмжээний удирдлагын админ хэсэг
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-right md:block">
              <div className="flex justify-between gap-4">
                  <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-300">
                    Нэвтэрсэн хэрэглэгч
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {username}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                >
                  Гарах
                </button>
              </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto px-20 py-8">
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div>{sidebar}</div>
            <div>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
