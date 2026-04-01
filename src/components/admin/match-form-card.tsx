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
    sport_key: "",
    start_at: "",
    venue: "",
    date_label: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!form.sport_key && sports.length > 0) {
      setForm((prev) => ({ ...prev, sport_key: sports[0].key }));
    }
  }, [sports, form.sport_key]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.sport_key) {
      setError("Sport сонгоно уу.");
      return;
    }

    if (!form.start_at) {
      setError("Start time оруулна уу.");
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        sport_key: form.sport_key,
        start_at: form.start_at,
        venue: form.venue?.trim() || "",
        date_label: form.date_label?.trim() || "",
        note: form.note?.trim() || "",
      });

      setSuccess("Schedule амжилттай үүслээ.");
      setForm({
        sport_key: sports[0]?.key ?? "",
        start_at: "",
        venue: "",
        date_label: "",
        note: "",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Schedule үүсгэхэд алдаа гарлаа.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="mb-5">
        <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
          Admin Action
        </div>
        <h2 className="mt-3 text-xl font-bold text-white">Create Schedule</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Ямар тэмцээн хэзээ болохыг бүртгэнэ.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Sport
          </label>
          <select
            value={form.sport_key}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                sport_key: e.target.value,
              }))
            }
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
            required
          >
            <option value="" className="bg-slate-900 text-white">
              Select sport
            </option>
            {sports.map((sport) => (
              <option
                key={sport.id}
                value={sport.key}
                className="bg-slate-900 text-white"
              >
                {sport.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Start At
          </label>
          <input
            type="datetime-local"
            value={form.start_at}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, start_at: e.target.value }))
            }
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Venue
            </label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, venue: e.target.value }))
              }
              placeholder="e.g. Main Arena"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Date Label
            </label>
            <input
              type="text"
              value={form.date_label}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, date_label: e.target.value }))
              }
              placeholder="e.g. 2026-04-01"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Note
          </label>
          <input
            type="text"
            value={form.note}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, note: e.target.value }))
            }
            placeholder="optional"
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
          {loading ? "Creating..." : "Create Schedule"}
        </button>
      </form>
    </div>
  );
}