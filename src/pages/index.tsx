// pages/index.tsx

import { useEffect } from "react";
import { useRouter } from "next/router";
import { getAuthUser } from "@/services/api";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getAuthUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "admin") {
      router.replace("/admin");
      return;
    }

    if (user.role === "captain") {
      router.replace("/captain");
      return;
    }

    router.replace("/user");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      Loading portal...
    </div>
  );
}