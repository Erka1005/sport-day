// components/draft/draft-shell.tsx

import { useEffect, useMemo, useState } from "react";
import { AuthUser } from "@/services/api";
import {
  addPlayerToPool,
  choosePlayerForTeam,
  confirmTeamChoice,
  getCaptainTeamId,
  loadDraftState,
  resetDraft,
  resolveCaptainTeamId,
  saveDraftState,
  startDraft,
  undoLastConfirm,
} from "@/services/draft-local";
import { DraftMode, DraftPlayer, DraftSportKey, DraftState } from "@/types/draft";

type DraftShellProps = {
  mode: DraftMode;
  user: AuthUser;
};

export default function DraftShell({ mode, user }: DraftShellProps) {
  const [state, setState] = useState<DraftState | null>(null);
  const [roundsInput, setRoundsInput] = useState(7);

  useEffect(() => {
    let draftState = loadDraftState();

    if (mode === "captain") {
      const resolved = resolveCaptainTeamId(draftState, user);
      draftState = resolved.nextState;
      saveDraftState(draftState);
    }

    setRoundsInput(draftState.rounds);
    setState(draftState);
  }, [mode, user]);

  function apply(next: DraftState) {
    saveDraftState(next);
    setState(next);
  }

  const captainTeamId = useMemo(() => {
    if (!state || mode !== "captain") return null;
    return getCaptainTeamId(state, user);
  }, [state, mode, user]);

  const selectedSport = state?.sports.find(
    (sport) => sport.key === state.selectedSportKey
  );

  const visiblePlayers = useMemo(() => {
    if (!state) return [];
    return state.players.filter((player) => player.sportKey === state.selectedSportKey);
  }, [state]);

  const draftedCount = useMemo(() => {
    if (!state) return 0;
    return state.players.filter((player) => player.draftedByTeamId !== null).length;
  }, [state]);

  const poolCount = useMemo(() => {
    if (!state) return 0;
    return state.players.filter(
      (player) => player.inPool && player.draftedByTeamId === null
    ).length;
  }, [state]);

  const myTurn = state && captainTeamId
    ? state.status === "running" && state.currentTurnTeamId === captainTeamId
    : false;

  if (!state) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-slate-200 backdrop-blur-xl">
        Loading draft board...
      </div>
    );
  }

  const pendingPlayerId = captainTeamId ? state.pendingChoices[captainTeamId] : null;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Draft Status" value={capitalize(state.status)} accent="emerald" />
        <StatCard label="Current Round" value={`${state.currentRound} / ${state.rounds}`} accent="cyan" />
        <StatCard label="Current Turn" value={`Team ${state.currentTurnTeamId}`} accent="amber" />
        <StatCard label="Picked Players" value={`${draftedCount} / ${state.totalTeams * state.rounds}`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-6">
          {mode === "admin" && (
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
              <div className="mb-4">
                <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                  Draft Control
                </div>
                <h2 className="mt-3 text-xl font-bold text-white">Admin Controls</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Start, reset, and undo draft actions for all 8 teams.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Rounds
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={roundsInput}
                    onChange={(e) => setRoundsInput(Number(e.target.value) || 1)}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    onClick={() => apply(startDraft(state, roundsInput))}
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-bold text-white"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => apply(resetDraft(state))}
                    className="rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 px-4 py-3 text-sm font-bold text-white"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => apply(undoLastConfirm(state))}
                    className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-white"
                  >
                    Undo
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === "captain" && captainTeamId && (
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
              <div className="mb-4">
                <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  Captain Panel
                </div>
                <h2 className="mt-3 text-xl font-bold text-white">
                  Team {captainTeamId} Controls
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Add players to the pool, choose a player, and confirm only when it
                  is your team&apos;s turn.
                </p>
              </div>

              <div className="space-y-4">
                <InfoRow label="Current turn" value={`Team ${state.currentTurnTeamId}`} />
                <InfoRow label="Your team" value={`Team ${captainTeamId}`} />
                <InfoRow label="Pool available" value={String(poolCount)} />
                <InfoRow
                  label="Pending choice"
                  value={
                    pendingPlayerId
                      ? state.players.find((p) => p.id === pendingPlayerId)?.name || "-"
                      : "-"
                  }
                />

                <button
                  disabled={!myTurn || !pendingPlayerId}
                  onClick={() => apply(confirmTeamChoice(state, captainTeamId))}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 px-4 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Confirm Pick
                </button>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-xs leading-6 text-slate-300">
                  {myTurn
                    ? "It is your turn. You can add a player to the pool, choose one, then confirm."
                    : "Waiting for the current team to finish its pick."}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
            <div className="mb-4">
              <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                Sports
              </div>
              <h2 className="mt-3 text-xl font-bold text-white">Draft by Sport</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {state.sports.map((sport) => {
                const active = state.selectedSportKey === sport.key;
                return (
                  <button
                    key={sport.key}
                    onClick={() => apply({ ...state, selectedSportKey: sport.key })}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      active
                        ? "bg-cyan-500 text-white"
                        : "border border-white/10 bg-white/10 text-slate-200 hover:bg-white/15"
                    }`}
                  >
                    {sport.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            </div>

            {state.history.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
                No draft actions yet.
              </div>
            ) : (
              <div className="space-y-3">
                {state.history.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-black/10 p-4"
                  >
                    <div className="text-sm font-medium text-white">{item.text}</div>
                    <div className="mt-1 text-xs text-slate-400">{item.createdAt}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
                  Player Pool
                </div>
                <h2 className="mt-2 text-xl font-bold text-white">
                  {selectedSport?.label ?? "Players"}
                </h2>
              </div>

              <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200">
                {visiblePlayers.length} players
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {visiblePlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  teamName={
                    player.draftedByTeamId
                      ? state.teams.find((t) => t.id === player.draftedByTeamId)?.name ?? null
                      : null
                  }
                  isPending={pendingPlayerId === player.id}
                  mode={mode}
                  canInteract={Boolean(myTurn && captainTeamId)}
                  onAddToPool={() => {
                    if (!captainTeamId) return;
                    apply(addPlayerToPool(state, player.id, captainTeamId));
                  }}
                  onChoose={() => {
                    if (!captainTeamId) return;
                    apply(choosePlayerForTeam(state, player.id, captainTeamId));
                  }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
            <div className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                Teams
              </div>
              <h2 className="mt-2 text-xl font-bold text-white">Draft Board</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {state.teams.map((team) => {
                const selectedSportPicks = team.picks
                  .map((id) => state.players.find((player) => player.id === id))
                  .filter(Boolean)
                  .filter((player) => player?.sportKey === state.selectedSportKey) as DraftPlayer[];

                const isCurrent = state.currentTurnTeamId === team.id;

                return (
                  <div
                    key={team.id}
                    className={`rounded-2xl border p-4 ${
                      isCurrent
                        ? "border-cyan-400/30 bg-cyan-400/10"
                        : "border-white/10 bg-black/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-white">{team.name}</div>
                        <div className="text-xs text-slate-400">
                          {team.picks.length} / {state.rounds} picks
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/15 px-3 py-1 text-[11px] font-semibold text-cyan-200">
                          Current Turn
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 space-y-2">
                      {selectedSportPicks.length === 0 ? (
                        <div className="text-xs text-slate-400">
                          No picks yet for this sport.
                        </div>
                      ) : (
                        selectedSportPicks.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2"
                          >
                            <img
                              src={player.photoUrl}
                              alt={player.name}
                              className="h-10 w-10 rounded-full border border-white/10 bg-white object-cover"
                            />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-white">
                                {player.name}
                              </div>
                              <div className="truncate text-xs text-slate-400">
                                {player.company}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function StatCard({
  label,
  value,
  accent = "white",
}: {
  label: string;
  value: string;
  accent?: "white" | "cyan" | "amber" | "emerald";
}) {
  const color =
    accent === "cyan"
      ? "text-cyan-300"
      : accent === "amber"
      ? "text-amber-300"
      : accent === "emerald"
      ? "text-emerald-300"
      : "text-white";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
      <div className="text-sm text-slate-300">{label}</div>
      <div className={`mt-2 text-3xl font-black ${color}`}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      <div className="text-sm text-slate-300">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function PlayerCard({
  player,
  teamName,
  isPending,
  mode,
  canInteract,
  onAddToPool,
  onChoose,
}: {
  player: DraftPlayer;
  teamName: string | null;
  isPending: boolean;
  mode: DraftMode;
  canInteract: boolean;
  onAddToPool: () => void;
  onChoose: () => void;
}) {
  const drafted = Boolean(player.draftedByTeamId);

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isPending
          ? "border-amber-400/30 bg-amber-400/10"
          : drafted
          ? "border-emerald-400/20 bg-emerald-400/10"
          : "border-white/10 bg-black/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <img
          src={player.photoUrl}
          alt={player.name}
          className="h-14 w-14 rounded-full border border-white/10 bg-white object-cover"
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">
            {player.name}
          </div>
          <div className="truncate text-xs text-slate-400">{player.company}</div>
          <div className="mt-1 text-xs text-slate-400">{player.gender}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {drafted ? (
          <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
            Drafted by {teamName}
          </span>
        ) : isPending ? (
          <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
            Pending confirmation
          </span>
        ) : player.inPool ? (
          <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
            In pool
          </span>
        ) : (
          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
            Not in pool
          </span>
        )}
      </div>

      {mode === "captain" && canInteract && !drafted ? (
        <div className="mt-4 flex gap-2">
          {!player.inPool ? (
            <button
              onClick={onAddToPool}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-xs font-semibold text-white"
            >
              Add to Pool
            </button>
          ) : (
            <button
              onClick={onChoose}
              className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-3 py-2 text-xs font-semibold text-white"
            >
              Choose
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}