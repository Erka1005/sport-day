// pages/admin.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthUser, getAuthUser } from "@/services/api";
import PortalLayout from "@/components/portal-layout";
import DashboardCard from "@/components/dashboard-card";
import EndpointListCard from "@/components/endpoint-list-card";

const adminEndpoints = [
  { method: "POST" as const, path: "/sports-day/sports", label: "Create sport" },
  { method: "POST" as const, path: "/sports-day/schedule", label: "Create match" },
  { method: "POST" as const, path: "/sports-day/match/{match_id}/result", label: "Set result" },
  { method: "POST" as const, path: "/sports-day/draft/start", label: "Start draft" },
];

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const currentUser = getAuthUser();

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser.role !== "admin") {
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
      portalLabel="Control Center"
      title="Event Control Center"
      subtitle="Overview and management tools for Sports Day operations"
      username={user.username}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Sports Setup" description="Create sports categories and manage event structure." tag="Management" />
        <DashboardCard title="Schedule Builder" description="Prepare and update match schedules before API integration." tag="Planning" />
        <DashboardCard title="Result Control" description="Record and review competition results from a single place." tag="Match Ops" />
        <DashboardCard title="Draft Session" description="Start and manage team draft flow for participants." tag="Draft" />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <EndpointListCard title="Planned API Actions" items={adminEndpoints} />

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white">Quick Notes</h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <p>Admin view is prepared as a UI shell first.</p>
            <p>Next step will be binding buttons and tables to real API data.</p>
            <p>Current cards and action blocks are mock-only placeholders.</p>
          </div>
        </div>
      </section>
    </PortalLayout>
  );
}