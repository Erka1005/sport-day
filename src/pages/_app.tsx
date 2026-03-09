// pages/_app.tsx

import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAuthUser } from "@/services/api";

const PUBLIC_ROUTES = ["/login"];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const user = getAuthUser();
    const isPublic = PUBLIC_ROUTES.includes(router.pathname);

    if (!user && !isPublic) {
      router.replace("/login");
      return;
    }

    if (user && router.pathname === "/login") {
      router.replace("/");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-xl bg-white px-6 py-4 shadow">
          Түр хүлээнэ үү...
        </div>
      </div>
    );
  }

  return <Component {...pageProps} />;
}