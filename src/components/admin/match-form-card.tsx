import { FormEvent, useEffect, useState } from "react";
import { CreateSchedulePayload, SportItem } from "@/services/api";

type MatchFormCardProps = {
  sports: SportItem[];
  onSubmit: (payload: CreateSchedulePayload) => Promise<void>;
};

export default function MatchFormCard({
  sports,
  onSubmit,
}: MatchFormCardProps) {
  const [form, setForm] = useState<CreateSchedulePayload>({
    sport_id: 0,
    date_label: "",
    start_time: "",
    end_time: "00:00",
    venue: "",
    status: "scheduled",
    note: "",
    sort_order: 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!form.sport_id && sports.length > 0) {
      setForm((prev) => ({
        ...prev,
        sport_id: sports[0].id,
      }));
    }
  }, [sports, form.sport_id]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.sport_id) {
      setError("Төрөл сонгоно уу.");
      return;
    }

    if (!form.date_label) {
      setError("Огноо оруулна уу.");
      return;
    }

    if (!form.start_time) {
      setError("Эхлэх цаг оруулна уу.");
      return;
    }

    if (!form.end_time) {
      setError("Дуусах цаг оруулна уу.");
      return;
    }

    if (!form.venue.trim()) {
      setError("Байршил оруулна уу.");
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        sport_id: form.sport_id,
        date_label: form.date_label,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue.trim(),
        status: form.status || "scheduled",
        note: form.note?.trim() || "",
        sort_order: Number(form.sort_order) || 1,
      });

      setSuccess("Хуваарь амжилттай үүслээ.");
      setForm({
        sport_id: sports[0]?.id ?? 0,
        date_label: "",
        start_time: "",
        end_time: "00:00",
        venue: "",
        status: "scheduled",
        note: "",
        sort_order: 1,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Хуваарь үүсгэхэд алдаа гарлаа.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="mb-5">
        <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-cyan-200">
          Админ үйлдэл
        </div>
        <h2 className="mt-3 text-xl font-bold text-white">Хуваарь бүртгэх</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Ямар тэмцээн хэдэн өдөр, хэдэн цагт, хаана болохыг бүртгэнэ.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Төрөл
          </label>
          <select
            value={form.sport_id}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                sport_id: Number(e.target.value),
              }))
            }
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
            required
          >
            <option value={0} className="bg-slate-900 text-white">
              Төрөл сонгох
            </option>
            {sports.map((sport) => (
              <option
                key={sport.id}
                value={sport.id}
                className="bg-slate-900 text-white"
              >
                {sport.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Огноо
            </label>
            <input
              type="date"
              value={form.date_label}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, date_label: e.target.value }))
              }
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Төлөв
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
            >
              <option value="scheduled" className="bg-slate-900 text-white">
                Scheduled
              </option>
              <option value="ongoing" className="bg-slate-900 text-white">
                Ongoing
              </option>
              <option value="completed" className="bg-slate-900 text-white">
                Completed
              </option>
              <option value="cancelled" className="bg-slate-900 text-white">
                Cancelled
              </option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Эхлэх цаг
            </label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, start_time: e.target.value }))
              }
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Дуусах цаг
            </label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, end_time: e.target.value }))
              }
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Байршил
            </label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, venue: e.target.value }))
              }
              placeholder="Жишээ: Mint Sport Club"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Эрэмбэ дараалал
            </label>
            <input
              type="number"
              min={1}
              value={form.sort_order}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sort_order: Number(e.target.value),
                }))
              }
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Тайлбар
          </label>
          <input
            type="text"
            value={form.note}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, note: e.target.value }))
            }
            placeholder="Жишээ: Female Basketball Champion"
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-4 py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(16,185,129,0.25)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Үүсгэж байна..." : "Хуваарь үүсгэх"}
        </button>
      </form>
    </div>
  );
}