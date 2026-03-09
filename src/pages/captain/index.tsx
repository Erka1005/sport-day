// pages/captain.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthUser, getAuthUser } from "@/services/api";
import PortalLayout from "@/components/portal-layout";
import DashboardCard from "@/components/dashboard-card";
import EndpointListCard from "@/components/endpoint-list-card";

const captainEndpoints = [
  { method: "PUT" as const, path: "/sports-day/teams/my/name", label: "Rename my team" },
  { method: "POST" as const, path: "/sports-day/draft/add-to-pool", label: "Add participant to pool" },
  { method: "POST" as const, path: "/sports-day/draft/choose", label: "Choose participant" },
  { method: "POST" as const, path: "/sports-day/draft/confirm", label: "Confirm selection" },
];

export default function CaptainPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const currentUser = getAuthUser();

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser.role !== "captain") {
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
      portalLabel="Team Hub"
      title="Team Hub"
      subtitle="Team coordination and draft-related actions"
      username={user.username}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Team Identity" description="Update and manage your team presentation settings." tag="Team" />
        <DashboardCard title="Draft Pool" description="Review and prepare available participants for selection." tag="Draft" />
        <DashboardCard title="Selection Flow" description="Choose participants and track current picks." tag="Selection" />
        <DashboardCard title="Confirmation" description="Finalize team decisions before the next phase." tag="Finalize" />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <EndpointListCard title="Planned API Actions" items={captainEndpoints} />

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white">Captain Preview</h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <p>This screen is built for captain-level workflow only.</p>
            <p>Later we can add real team roster tables and draft status.</p>
            <p>Current buttons are intentionally mock until API wiring starts.</p>
          </div>
        </div>
      </section>
    </PortalLayout>
  );
}