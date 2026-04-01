import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  SportItem,
  TeamItem,
  TeamMemberItem,
  bulkAddMembersApi,
  bulkRemoveMembersApi,
  bulkSetMembersApi,
  deleteMemberApi,
  listMembersApi,
  updateMemberApi,
} from "@/services/api";
import { resolveMediaUrl } from "@/lib/media";

type Props = {
  userId: number;
  teams: TeamItem[];
  sports: SportItem[];
};

type EditState = {
  id: number;
  employee_name: string;
  sport_key: string;
  leader: boolean;
  note: string;
  photo: File | null;
  currentPhotoUrl: string | null;
};

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase() || "")
    .join("");
}

export default function RosterManagementCard({
  userId,
  teams,
  sports,
}: Props) {
  const [teamCode, setTeamCode] = useState("");
  const [sportKey, setSportKey] = useState("");

  const [addText, setAddText] = useState("");
  const [setText, setSetText] = useState("");
  const [removeText, setRemoveText] = useState("");

  const [players, setPlayers] = useState<TeamMemberItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editing, setEditing] = useState<EditState | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editPreview, setEditPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!teamCode && teams.length > 0) setTeamCode(teams[0].code);
  }, [teams, teamCode]);

  useEffect(() => {
    if (!sportKey && sports.length > 0) setSportKey(sports[0].key);
  }, [sports, sportKey]);

  const canSubmit = useMemo(() => Boolean(teamCode && sportKey), [teamCode, sportKey]);

  async function loadRoster() {
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      const items = await listMembersApi({
        team_code: teamCode,
        sport_key: sportKey,
        userId,
      });
      setPlayers(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Roster ачаалахад алдаа гарлаа.");
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canSubmit) return;
    void loadRoster();
  }, [teamCode, sportKey]);

  useEffect(() => {
    return () => {
      if (editPreview) URL.revokeObjectURL(editPreview);
    };
  }, [editPreview]);

  async function handleBulkAdd() {
    const names = parseLines(addText);
    if (!canSubmit) return setError("Team болон sport сонгоно уу.");
    if (names.length === 0) return setError("Нэмэх хүмүүсийн нэрээ оруулна уу.");

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const message = await bulkAddMembersApi(
        { team_code: teamCode, sport_key: sportKey, members: names },
        userId
      );
      setSuccess(message);
      setAddText("");
      await loadRoster();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk add хийхэд алдаа гарлаа.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkSet() {
    const names = parseLines(setText);
    if (!canSubmit) return setError("Team болон sport сонгоно уу.");
    if (names.length === 0) return setError("Set хийх хүмүүсийн нэрээ оруулна уу.");

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const message = await bulkSetMembersApi(
        { team_code: teamCode, sport_key: sportKey, members: names },
        userId
      );
      setSuccess(message);
      setSetText("");
      await loadRoster();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk set хийхэд алдаа гарлаа.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkRemove() {
    const names = parseLines(removeText);
    if (!canSubmit) return setError("Team болон sport сонгоно уу.");
    if (names.length === 0) return setError("Устгах хүмүүсийн нэрээ оруулна уу.");

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const message = await bulkRemoveMembersApi(
        { team_code: teamCode, sport_key: sportKey, employee_names: names },
        userId
      );
      setSuccess(message);
      setRemoveText("");
      await loadRoster();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk remove хийхэд алдаа гарлаа.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(memberId: number) {
    const ok = window.confirm("Энэ member-ийг устгах уу?");
    if (!ok) return;

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const message = await deleteMemberApi(memberId, userId);
      setSuccess(message);
      await loadRoster();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Member устгахад алдаа гарлаа.");
    } finally {
      setActionLoading(false);
    }
  }

  function openEditModal(player: TeamMemberItem) {
    if (editPreview) {
      URL.revokeObjectURL(editPreview);
      setEditPreview(null);
    }

    setEditing({
      id: player.id,
      employee_name: player.employee_name,
      sport_key: player.sport_key || sportKey,
      leader: Boolean(player.leader),
      note: player.note || "",
      photo: null,
      currentPhotoUrl: player.photo_url,
    });
  }

  function closeEditModal() {
    if (editPreview) {
      URL.revokeObjectURL(editPreview);
      setEditPreview(null);
    }
    setEditing(null);
  }

  function handleEditPhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!editing) return;

    if (editPreview) {
      URL.revokeObjectURL(editPreview);
      setEditPreview(null);
    }

    if (file) {
      setEditPreview(URL.createObjectURL(file));
    }

    setEditing({ ...editing, photo: file });
  }

  async function handleSaveEdit() {
    if (!editing) return;
    if (!editing.employee_name.trim()) return setError("Employee name required.");
    if (!editing.sport_key.trim()) return setError("Sport key required.");

    setEditLoading(true);
    setError("");
    setSuccess("");

    try {
      const updated = await updateMemberApi(
        editing.id,
        {
          employee_name: editing.employee_name.trim(),
          sport_key: editing.sport_key.trim(),
          leader: editing.leader,
          note: editing.note.trim(),
          photo: editing.photo,
        },
        userId
      );

      setSuccess(`${updated.employee_name} амжилттай шинэчлэгдлээ.`);
      closeEditModal();
      await loadRoster();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Member засах үед алдаа гарлаа.");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white">Roster Management</h2>
          <p className="mt-2 text-sm text-slate-300">
            Team member-үүдийг bulk add, bulk set, bulk remove, edit, delete хийнэ.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Team</label>
              <select
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none"
              >
                <option value="" className="bg-slate-900 text-white">
                  Select team
                </option>
                {teams.map((team) => (
                  <option key={team.id} value={team.code} className="bg-slate-900 text-white">
                    {team.code} - {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Sport</label>
              <select
                value={sportKey}
                onChange={(e) => setSportKey(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none"
              >
                <option value="" className="bg-slate-900 text-white">
                  Select sport
                </option>
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.key} className="bg-slate-900 text-white">
                    {sport.name} ({sport.key})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <BulkCard
            title="Bulk Add"
            value={addText}
            onChange={setAddText}
            placeholder={"Bat-Erdene\nTemuulen\nAnu"}
            buttonText={actionLoading ? "Processing..." : "Bulk Add"}
            onSubmit={handleBulkAdd}
            buttonClassName="bg-gradient-to-r from-cyan-500 to-emerald-500"
          />

         
          <BulkCard
            title="Bulk Remove"
            value={removeText}
            onChange={setRemoveText}
            placeholder={"Temuulen\nAnu"}
            buttonText={actionLoading ? "Processing..." : "Bulk Remove"}
            onSubmit={handleBulkRemove}
            buttonClassName="bg-gradient-to-r from-rose-500 to-orange-500"
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Current Members</h3>
              <p className="mt-1 text-sm text-slate-300">
                {teamCode || "-"} / {sportKey || "-"}
              </p>
            </div>

            <button
              onClick={() => void loadRoster()}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
              Loading roster...
            </div>
          ) : players.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
              Одоогоор member алга.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {players.map((player) => {
                const imageUrl = resolveMediaUrl(player.photo_url);

                return (
                  <div
                    key={player.id}
                    className="rounded-2xl border border-white/10 bg-black/10 p-4"
                  >
                    <div className="flex items-center gap-3">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={player.employee_name}
                          className="h-16 w-16 rounded-2xl object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = "none";
                            const fallback = target.nextElementSibling as HTMLElement | null;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}

                      <div
                        className={`${
                          imageUrl ? "hidden" : "flex"
                        } h-16 w-16 items-center justify-center rounded-2xl bg-slate-700 text-sm font-bold text-slate-200`}
                      >
                        {initials(player.employee_name) || "U"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">
                          {player.employee_name}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {player.leader ? (
                            <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                              ⭐ Leader
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full border border-slate-400/20 bg-slate-400/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200">
                              Member
                            </span>
                          )}
                        </div>

                        {player.note ? (
                          <div className="mt-2 text-xs text-slate-400">{player.note}</div>
                        ) : null}

                        {imageUrl ? (
                          <div className="mt-2 truncate text-[11px] text-slate-500">
                            {imageUrl}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => openEditModal(player)}
                        className="rounded-xl bg-cyan-500 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-600"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => void handleDelete(player.id)}
                        className="rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#07111f] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">Edit Member</h3>
                <p className="mt-1 text-sm text-slate-300">
                  Name, sport, leader, note, photo шинэчилнэ.
                </p>
              </div>

              <button
                onClick={closeEditModal}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
              >
                Close
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-[180px_1fr]">
              <div>
                <div className="mb-3 text-sm font-medium text-slate-200">Preview</div>

                {editPreview ? (
                  <img
                    src={editPreview}
                    alt="preview"
                    className="h-40 w-full rounded-2xl object-cover"
                  />
                ) : resolveMediaUrl(editing.currentPhotoUrl) ? (
                  <img
                    src={resolveMediaUrl(editing.currentPhotoUrl) || ""}
                    alt={editing.employee_name}
                    className="h-40 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center rounded-2xl bg-slate-700 text-lg font-bold text-slate-200">
                    {initials(editing.employee_name) || "U"}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    value={editing.employee_name}
                    onChange={(e) =>
                      setEditing({ ...editing, employee_name: e.target.value })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Sport Key
                  </label>
                  <select
                    value={editing.sport_key}
                    onChange={(e) =>
                      setEditing({ ...editing, sport_key: e.target.value })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none"
                  >
                    {sports.map((sport) => (
                      <option key={sport.id} value={sport.key} className="bg-slate-900 text-white">
                        {sport.name} ({sport.key})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Note
                  </label>
                  <textarea
                    rows={3}
                    value={editing.note}
                    onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none"
                    placeholder="Optional note"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="leader-checkbox"
                    type="checkbox"
                    checked={editing.leader}
                    onChange={(e) => setEditing({ ...editing, leader: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <label htmlFor="leader-checkbox" className="text-sm font-medium text-slate-200">
                    Leader
                  </label>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Upload Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditPhotoChange}
                    className="block w-full text-sm text-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15"
              >
                Cancel
              </button>

              <button
                onClick={() => void handleSaveEdit()}
                disabled={editLoading}
                className="rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function BulkCard({
  title,
  value,
  onChange,
  placeholder,
  buttonText,
  onSubmit,
  buttonClassName,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  buttonText: string;
  onSubmit: () => void;
  buttonClassName: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-300">Нэг мөрөнд нэг нэр оруулна.</p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        placeholder={placeholder}
        className="mt-4 w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none"
      />

      <button
        onClick={onSubmit}
        className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-bold text-white ${buttonClassName}`}
      >
        {buttonText}
      </button>
    </div>
  );
}