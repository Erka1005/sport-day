// pages/index.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthUser, getAuthUser, logout } from "@/services/api";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const currentUser = getAuthUser();
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    setUser(currentUser);
  }, [router]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        Уншиж байна...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">
              {user.username} • {user.role}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Гарах
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Сайн байна уу, {user.username}
          </h2>
          <p className="mt-2 text-slate-600">
            Та <span className="font-semibold">{user.role}</span> role-оор
            амжилттай нэвтэрлээ.
          </p>
        </div>

        {user.role === "admin" && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card
              title="Admin Panel"
              desc="Хэрэглэгч, тохиргоо, системийн бүх удирдлага."
            />
            <Card
              title="Reports"
              desc="Системийн тайлан болон хяналтын хэсэг."
            />
            <Card
              title="Management"
              desc="Бүх төрлийн удирдлагын функцүүд."
            />
          </div>
        )}

        {user.role === "captain" && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card
              title="Captain Board"
              desc="Багийн гишүүд болон ажиллагааны хяналт."
            />
            <Card
              title="Assignments"
              desc="Даалгавар, хуваарилалт, явцын хяналт."
            />
            <Card
              title="Team Progress"
              desc="Ахиц дэвшил болон бүртгэлийн хэсэг."
            />
          </div>
        )}

        {user.role === "user" && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card
              title="My Profile"
              desc="Өөрийн мэдээлэл болон account тохиргоо."
            />
            <Card
              title="My Tasks"
              desc="Өөрийн хийх ажлууд болон явц."
            />
            <Card
              title="My Activity"
              desc="Сүүлийн үйлдлүүд болон мэдээллүүд."
            />
          </div>
        )}
      </main>
    </div>
  );
}

type CardProps = {
  title: string;
  desc: string;
};

function Card({ title, desc }: CardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
    </div>
  );
}