// pages/user.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthUser, getAuthUser } from "@/services/api";
import PortalLayout from "@/components/portal-layout";
import DashboardCard from "@/components/dashboard-card";
import EndpointListCard from "@/components/endpoint-list-card";

const userEndpoints = [
  { method: "GET" as const, path: "/sports-day/teams", label: "List teams" },
  { method: "GET" as const, path: "/sports-day/standings", label: "View standings" },
  { method: "GET" as const, path: "/sports-day/sports", label: "List sports" },
  { method: "GET" as const, path: "/sports-day/schedule", label: "List matches" },
];

export default function UserPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const currentUser = getAuthUser();

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser.role !== "user") {
      router.replace("/");
      return;
    }

    setUser(currentUser);
  }, [router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading...
      </div>
    );
  }

  return (
    <PortalLayout
      portalLabel="Personal Hub"
      title="Sports Day Portal"
      subtitle="View teams, standings, sports, and match schedules"
      username={user.username}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Teams" description="Browse available teams and current member information." tag="Browse" />
        <DashboardCard title="Standings" description="Check rankings and updated performance overview." tag="Ranking" />
        <DashboardCard title="Sports" description="See all available sports and competition categories." tag="Events" />
        <DashboardCard title="Schedule" description="Review upcoming matches and event timing." tag="Timeline" />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <EndpointListCard title="Planned API Actions" items={userEndpoints} />

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white">Public View Notes</h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <p>This area is intended for regular portal users.</p>
            <p>Only viewing features are shown here at the first stage.</p>
            <p>We can later replace these blocks with real standings, team lists, and schedules.</p>
          </div>
        </div>
      </section>
    </PortalLayout>
  );
}