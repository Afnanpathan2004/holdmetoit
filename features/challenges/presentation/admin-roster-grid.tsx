"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Edit,
  Plus,
  ArrowLeft,
  Calendar,
  Sparkles,
  ExternalLink,
  History,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { overrideStudyHoursAction } from "@/features/study-logs/api/study-log-override.action";
import {
  adminAddGoalAction,
  adminEditGoalAction,
  adminToggleGoalAction,
} from "@/features/declarations/api/admin-goal.actions";
import {
  pardonParticipantAction,
  revokePardonAction,
} from "@/features/accountability/api/pardon.actions";
import {
  formatSecondsToClock,
  parseDurationToSeconds,
} from "@/features/study-logs/domain/duration";

export interface RosterParticipant {
  id: string;
  userId: string;
  targetSeconds: number;
  status: string;
  user: {
    id: string;
    name: string | null;
    displayName: string | null;
    username: string | null;
    image: string | null;
  };
  team: {
    id: string;
    name: string;
    iconEmoji: string | null;
  };
  dailyStudyLogs: {
    id: string;
    logDate: string;
    durationSeconds: number;
    isOverride: boolean;
    overrideReason?: string | null;
  }[];
  weeklyGoals: {
    id: string;
    description: string;
    completed: boolean;
  }[];
  punishmentRecord?: {
    id: string;
    isPunished: boolean;
    isPardoned: boolean;
    pardonReason?: string | null;
    hoursDeficitSeconds: number;
    incompleteGoalsCount: number;
  } | null;
}

export interface AdminRosterGridProps {
  challenge: {
    id: string;
    title: string;
    format: string;
    status: string;
    startAt: string;
    endAt: string;
  };
  participants: RosterParticipant[];
}

export function AdminRosterGrid({ challenge, participants }: AdminRosterGridProps) {
  // Modal states
  const [overrideModalParticipant, setOverrideModalParticipant] =
    useState<RosterParticipant | null>(null);
  const [goalsModalParticipant, setGoalsModalParticipant] =
    useState<RosterParticipant | null>(null);
  const [pardonModalParticipant, setPardonModalParticipant] =
    useState<RosterParticipant | null>(null);

  // Override Form state
  const todayIso = new Date().toISOString().slice(0, 10);
  const [overrideDate, setOverrideDate] = useState(todayIso);
  const [overrideClock, setOverrideClock] = useState("02:00:00");
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);

  // Goal Form states
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalDesc, setEditGoalDesc] = useState("");
  const [goalReason, setGoalReason] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [isGoalActionPending, setIsGoalActionPending] = useState(false);
  const [goalActionError, setGoalActionError] = useState<string | null>(null);

  // Pardon Form state
  const [pardonReason, setPardonReason] = useState("");
  const [isPardonPending, setIsPardonPending] = useState(false);
  const [pardonError, setPardonError] = useState<string | null>(null);

  // Handle Hours Override submission
  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModalParticipant) return;

    setOverrideError(null);
    setOverrideSuccess(null);

    let durationSeconds = 0;
    try {
      durationSeconds = parseDurationToSeconds(overrideClock);
    } catch {
      setOverrideError("Invalid clock format. Use HH:MM:SS.");
      return;
    }

    if (!overrideReason.trim() || overrideReason.trim().length < 3) {
      setOverrideError("Audit reason must be at least 3 characters.");
      return;
    }

    setIsSubmittingOverride(true);

    const res = await overrideStudyHoursAction({
      challengeId: challenge.id,
      participantId: overrideModalParticipant.id,
      logDate: overrideDate,
      durationSeconds,
      reason: overrideReason.trim(),
    });

    setIsSubmittingOverride(false);

    if (!res.ok) {
      setOverrideError(res.error);
    } else {
      setOverrideSuccess("Hours successfully overridden and logged in audit trail.");
      setTimeout(() => {
        setOverrideModalParticipant(null);
        setOverrideSuccess(null);
        setOverrideReason("");
      }, 1500);
    }
  };

  // Handle Goal Toggle
  const handleToggleGoal = async (goalId: string, currentCompleted: boolean) => {
    if (!goalsModalParticipant) return;
    if (!goalReason.trim() || goalReason.trim().length < 3) {
      setGoalActionError("Audit reason (at least 3 characters) is required to update goal.");
      return;
    }

    setGoalActionError(null);
    setIsGoalActionPending(true);

    const res = await adminToggleGoalAction({
      challengeId: challenge.id,
      goalId,
      completed: !currentCompleted,
      reason: goalReason.trim(),
    });

    setIsGoalActionPending(false);

    if (!res.ok) {
      setGoalActionError(res.error);
    } else {
      // Update local state optimistically
      setGoalsModalParticipant((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          weeklyGoals: prev.weeklyGoals.map((g) =>
            g.id === goalId ? { ...g, completed: !currentCompleted } : g,
          ),
        };
      });
      setGoalReason("");
    }
  };

  // Handle Goal Edit
  const handleSaveGoalEdit = async (goalId: string) => {
    if (!goalsModalParticipant || !editGoalDesc.trim()) return;
    if (!goalReason.trim() || goalReason.trim().length < 3) {
      setGoalActionError("Audit reason (at least 3 characters) is required to edit goal.");
      return;
    }

    setGoalActionError(null);
    setIsGoalActionPending(true);

    const res = await adminEditGoalAction({
      challengeId: challenge.id,
      goalId,
      description: editGoalDesc.trim(),
      reason: goalReason.trim(),
    });

    setIsGoalActionPending(false);

    if (!res.ok) {
      setGoalActionError(res.error);
    } else {
      setGoalsModalParticipant((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          weeklyGoals: prev.weeklyGoals.map((g) =>
            g.id === goalId ? { ...g, description: editGoalDesc.trim() } : g,
          ),
        };
      });
      setEditingGoalId(null);
      setEditGoalDesc("");
      setGoalReason("");
    }
  };

  // Handle Add Goal
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalsModalParticipant || !newGoalDesc.trim()) return;
    if (!goalReason.trim() || goalReason.trim().length < 3) {
      setGoalActionError("Audit reason (at least 3 characters) is required to add goal.");
      return;
    }

    setGoalActionError(null);
    setIsGoalActionPending(true);

    const res = await adminAddGoalAction({
      challengeId: challenge.id,
      participantId: goalsModalParticipant.id,
      description: newGoalDesc.trim(),
      reason: goalReason.trim(),
    });

    setIsGoalActionPending(false);

    if (!res.ok) {
      setGoalActionError(res.error);
    } else {
      setGoalsModalParticipant((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          weeklyGoals: [
            ...prev.weeklyGoals,
            { id: res.goalId, description: newGoalDesc.trim(), completed: false },
          ],
        };
      });
      setNewGoalDesc("");
      setGoalReason("");
    }
  };

  // Handle Pardon submission
  const handlePardonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pardonModalParticipant) return;
    if (!pardonReason.trim() || pardonReason.trim().length < 3) {
      setPardonError("Audit reason is required to issue a pardon.");
      return;
    }

    setPardonError(null);
    setIsPardonPending(true);

    const res = await pardonParticipantAction({
      challengeId: challenge.id,
      participantId: pardonModalParticipant.id,
      reason: pardonReason.trim(),
    });

    setIsPardonPending(false);

    if (!res.ok) {
      setPardonError(res.error);
    } else {
      setPardonModalParticipant(null);
      setPardonReason("");
    }
  };

  // Handle Revoke Pardon
  const handleRevokePardon = async () => {
    if (!pardonModalParticipant) return;
    if (!pardonReason.trim() || pardonReason.trim().length < 3) {
      setPardonError("Audit reason is required to revoke a pardon.");
      return;
    }

    setPardonError(null);
    setIsPardonPending(true);

    const res = await revokePardonAction({
      challengeId: challenge.id,
      participantId: pardonModalParticipant.id,
      reason: pardonReason.trim(),
    });

    setIsPardonPending(false);

    if (!res.ok) {
      setPardonError(res.error);
    } else {
      setPardonModalParticipant(null);
      setPardonReason("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/challenges/${challenge.id}`}
              className="inline-flex items-center gap-1 text-xs text-cafe-oatmeal hover:text-cafe-honey-light transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Challenge Hub</span>
            </Link>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-cafe-parchment sm:text-3xl">
            Roster & Hours Override Grid
          </h1>
          <p className="text-xs text-cafe-oatmeal">
            Host administrative controls: inline study hours overrides, mid-event goal adjustments, and pardons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/challenge/${challenge.id}`}
            target="_blank"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-cafe-border bg-cafe-card px-4 py-2 text-xs font-medium text-cafe-parchment hover:bg-cafe-wood transition-colors"
          >
            <ExternalLink className="size-3.5" />
            <span>View Public Scoreboard</span>
          </Link>
        </div>
      </div>

      {/* Participants Roster List */}
      {participants.length === 0 ? (
        <div className="rounded-3xl border border-cafe-border bg-cafe-card p-12 text-center shadow-cafe">
          <Clock className="mx-auto size-12 text-cafe-oatmeal/40" />
          <h3 className="mt-4 font-serif text-lg font-bold text-cafe-parchment">
            No participants enrolled
          </h3>
          <p className="mt-1 text-xs text-cafe-oatmeal">
            Return to the challenge hub to assign members to house teams.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-cafe-border bg-cafe-card shadow-cafe overflow-hidden">
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Roster & Hours Grid">
              <thead className="border-b border-cafe-border bg-cafe-wood/50 text-cafe-oatmeal uppercase font-medium">
                <tr>
                  <th scope="col" className="px-6 py-4">Participant</th>
                  <th scope="col" className="px-4 py-4">House Team</th>
                  <th scope="col" className="px-4 py-4">Logged / Target</th>
                  <th scope="col" className="px-4 py-4">Goals</th>
                  <th scope="col" className="px-4 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-border text-cafe-linen">
                {participants.map((p) => {
                  const loggedTotal = p.dailyStudyLogs.reduce(
                    (acc, l) => acc + l.durationSeconds,
                    0,
                  );
                  const completedGoals = p.weeklyGoals.filter((g) => g.completed).length;
                  const totalGoals = p.weeklyGoals.length;
                  const hasOverrides = p.dailyStudyLogs.some((l) => l.isOverride);
                  const isPardoned = p.punishmentRecord?.isPardoned ?? false;

                  return (
                    <tr key={p.id} className="hover:bg-cafe-wood/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full border border-cafe-border bg-cafe-wood flex items-center justify-center font-bold text-cafe-honey">
                            {(p.user.displayName ?? p.user.name ?? "S")[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-cafe-parchment">
                              {p.user.displayName ?? p.user.name}
                            </div>
                            <div className="text-[11px] text-cafe-oatmeal">
                              @{p.user.username ?? p.user.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-cafe-border bg-cafe-wood px-2.5 py-1 text-xs text-cafe-parchment">
                          <span>{p.team.iconEmoji ?? "🛡️"}</span>
                          <span>{p.team.name}</span>
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-cafe-parchment">
                          {formatSecondsToClock(loggedTotal)} /{" "}
                          {formatSecondsToClock(p.targetSeconds)}
                        </div>
                        {hasOverrides && (
                          <div className="text-[10px] text-cafe-honey-light">
                            ★ host override applied
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs">
                          {completedGoals} / {totalGoals} done
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        {isPardoned ? (
                          <span className="rounded-full border border-cafe-sage/40 bg-cafe-sage-surface px-2.5 py-0.5 text-[11px] font-semibold text-cafe-sage">
                            Pardoned
                          </span>
                        ) : p.status === "PUNISHED" ? (
                          <span className="rounded-full border border-cafe-terracotta/40 bg-cafe-terracotta-surface px-2.5 py-0.5 text-[11px] font-semibold text-cafe-terracotta">
                            Punished
                          </span>
                        ) : (
                          <span className="rounded-full border border-cafe-border bg-cafe-wood px-2.5 py-0.5 text-[11px] text-cafe-linen">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setOverrideModalParticipant(p);
                            setOverrideError(null);
                            setOverrideSuccess(null);
                          }}
                          className="min-h-[36px] text-xs"
                        >
                          <Clock className="size-3.5 text-cafe-honey" />
                          <span>Override Hours</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setGoalsModalParticipant(p);
                            setGoalActionError(null);
                          }}
                          className="min-h-[36px] text-xs"
                        >
                          <Edit className="size-3.5" />
                          <span>Goals</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setPardonModalParticipant(p);
                            setPardonError(null);
                          }}
                          className="min-h-[36px] text-xs text-cafe-oatmeal hover:text-cafe-parchment"
                        >
                          <ShieldCheck className="size-3.5 text-cafe-sage" />
                          <span>Pardon</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View (< 768px down to 360px) */}
          <div className="divide-y divide-cafe-border md:hidden">
            {participants.map((p) => {
              const loggedTotal = p.dailyStudyLogs.reduce(
                (acc, l) => acc + l.durationSeconds,
                0,
              );
              const completedGoals = p.weeklyGoals.filter((g) => g.completed).length;
              const totalGoals = p.weeklyGoals.length;
              const hasOverrides = p.dailyStudyLogs.some((l) => l.isOverride);
              const isPardoned = p.punishmentRecord?.isPardoned ?? false;

              return (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-cafe-parchment">
                        {p.user.displayName ?? p.user.name}
                      </div>
                      <div className="text-xs text-cafe-oatmeal">
                        @{p.user.username ?? p.user.name}
                      </div>
                    </div>
                    <span className="rounded-lg border border-cafe-border bg-cafe-wood px-2 py-0.5 text-xs text-cafe-linen">
                      {p.team.iconEmoji ?? "🛡️"} {p.team.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-cafe-border bg-cafe-wood p-2">
                      <div className="text-[10px] text-cafe-oatmeal">Hours Logged</div>
                      <div className="font-mono font-medium text-cafe-parchment">
                        {formatSecondsToClock(loggedTotal)} / {formatSecondsToClock(p.targetSeconds)}
                      </div>
                      {hasOverrides && (
                        <div className="text-[9px] text-cafe-honey-light">★ override</div>
                      )}
                    </div>

                    <div className="rounded-xl border border-cafe-border bg-cafe-wood p-2">
                      <div className="text-[10px] text-cafe-oatmeal">Goals & Status</div>
                      <div className="font-mono text-cafe-parchment">
                        {completedGoals} / {totalGoals} done
                      </div>
                      <div className="text-[10px] font-semibold text-cafe-linen mt-0.5">
                        {isPardoned ? "Pardoned" : p.status}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setOverrideModalParticipant(p)}
                      className="min-h-[44px] flex-1 text-xs"
                    >
                      <Clock className="size-3.5 text-cafe-honey" />
                      <span>Override</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setGoalsModalParticipant(p)}
                      className="min-h-[44px] flex-1 text-xs"
                    >
                      <Edit className="size-3.5" />
                      <span>Goals</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPardonModalParticipant(p)}
                      className="min-h-[44px] text-xs"
                    >
                      <ShieldCheck className="size-3.5 text-cafe-sage" />
                      <span>Pardon</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: Hours Override Dialog (FEAT-LOG-04 / Law L5) */}
      {overrideModalParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe">
            <div className="flex items-center justify-between border-b border-cafe-border pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-cafe-parchment">
                  Admin Study Hours Override (Law L5)
                </h3>
                <p className="text-xs text-cafe-oatmeal">
                  Participant:{" "}
                  <strong className="text-cafe-linen">
                    {overrideModalParticipant.user.displayName ??
                      overrideModalParticipant.user.name}
                  </strong>
                </p>
              </div>
            </div>

            {overrideError && (
              <div className="mt-3 text-xs text-cafe-terracotta">{overrideError}</div>
            )}
            {overrideSuccess && (
              <div className="mt-3 text-xs text-cafe-sage">{overrideSuccess}</div>
            )}

            <form onSubmit={handleOverrideSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-cafe-linen">Date of Study Log</label>
                <Input
                  type="date"
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-cafe-linen">
                  Duration (HH:MM:SS) — Internal seconds precision
                </label>
                <Input
                  value={overrideClock}
                  onChange={(e) => setOverrideClock(e.target.value)}
                  placeholder="03:45:00"
                  className="mt-1 font-mono"
                  required
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["00:00:00", "01:00:00", "02:30:00", "04:00:00"].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setOverrideClock(preset)}
                      className="rounded border border-cafe-border bg-cafe-wood px-2 py-0.5 font-mono text-[10px] text-cafe-oatmeal hover:text-cafe-linen"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-cafe-linen">
                  Mandatory Audit Reason (FEAT-AUDIT-01)
                </label>
                <Input
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Timer app crashed on mobile"
                  className="mt-1"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOverrideModalParticipant(null)}
                  disabled={isSubmittingOverride}
                  className="min-h-[44px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingOverride}
                  className="min-h-[44px]"
                >
                  {isSubmittingOverride ? "Saving Override..." : "Save Override"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Goal Management Dialog (FEAT-DECL-04) */}
      {goalsModalParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe space-y-4">
            <div className="border-b border-cafe-border pb-3">
              <h3 className="font-serif text-lg font-bold text-cafe-parchment">
                Manage Weekly Goals (FEAT-DECL-04)
              </h3>
              <p className="text-xs text-cafe-oatmeal">
                Host permission to edit descriptions, toggle completion, or add goals.
              </p>
            </div>

            {goalActionError && (
              <div className="text-xs text-cafe-terracotta">{goalActionError}</div>
            )}

            <div>
              <label className="text-xs text-cafe-linen">
                Audit Reason (Required for all changes)
              </label>
              <Input
                value={goalReason}
                onChange={(e) => setGoalReason(e.target.value)}
                placeholder="e.g. Student requested scope adjustment"
                className="mt-1"
              />
            </div>

            {/* List of Existing Goals */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-cafe-linen">Current Goals</div>
              {goalsModalParticipant.weeklyGoals.length === 0 ? (
                <p className="text-xs italic text-cafe-ash">No goals declared.</p>
              ) : (
                goalsModalParticipant.weeklyGoals.map((g) => (
                  <div
                    key={g.id}
                    className="flex flex-col gap-2 rounded-xl border border-cafe-border bg-cafe-wood p-3"
                  >
                    {editingGoalId === g.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editGoalDesc}
                          onChange={(e) => setEditGoalDesc(e.target.value)}
                          className="text-xs"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingGoalId(null)}
                            className="h-8 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveGoalEdit(g.id)}
                            disabled={isGoalActionPending}
                            className="h-8 text-xs"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={g.completed}
                            onChange={() => handleToggleGoal(g.id, g.completed)}
                            disabled={isGoalActionPending}
                            className="size-4 accent-cafe-honey rounded"
                          />
                          <span
                            className={`text-xs ${
                              g.completed
                                ? "line-through text-cafe-oatmeal"
                                : "text-cafe-parchment"
                            }`}
                          >
                            {g.description}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingGoalId(g.id);
                            setEditGoalDesc(g.description);
                          }}
                          className="h-7 px-2 text-xs text-cafe-oatmeal hover:text-cafe-linen"
                        >
                          <Edit className="size-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add New Goal Section */}
            <form onSubmit={handleAddGoal} className="border-t border-cafe-border pt-3 space-y-2">
              <div className="text-xs font-semibold text-cafe-linen">Add New Goal</div>
              <div className="flex gap-2">
                <Input
                  value={newGoalDesc}
                  onChange={(e) => setNewGoalDesc(e.target.value)}
                  placeholder="New goal description..."
                  className="text-xs flex-1"
                />
                <Button
                  type="submit"
                  disabled={isGoalActionPending}
                  className="min-h-[44px] text-xs gap-1"
                >
                  <Plus className="size-3.5" />
                  <span>Add</span>
                </Button>
              </div>
            </form>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setGoalsModalParticipant(null)}
                className="min-h-[44px]"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Pardon Dialog (FEAT-PUN-04) */}
      {pardonModalParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe">
            <h3 className="font-serif text-lg font-bold text-cafe-parchment">
              Host Pardon / Excuse Override (FEAT-PUN-04)
            </h3>
            <p className="mt-1 text-xs text-cafe-oatmeal">
              Participant:{" "}
              <strong>
                {pardonModalParticipant.user.displayName ??
                  pardonModalParticipant.user.name}
              </strong>
            </p>

            {pardonError && (
              <div className="mt-3 text-xs text-cafe-terracotta">{pardonError}</div>
            )}

            <form onSubmit={handlePardonSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-cafe-linen">
                  Mandatory Pardon Reason
                </label>
                <Input
                  value={pardonReason}
                  onChange={(e) => setPardonReason(e.target.value)}
                  placeholder="e.g. Medical emergency verified by host"
                  className="mt-1"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {pardonModalParticipant.punishmentRecord?.isPardoned && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRevokePardon}
                    disabled={isPardonPending}
                    className="min-h-[44px] text-xs text-cafe-terracotta hover:text-cafe-terracotta"
                  >
                    Revoke Pardon
                  </Button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPardonModalParticipant(null)}
                    disabled={isPardonPending}
                    className="min-h-[44px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPardonPending}
                    className="min-h-[44px] bg-cafe-sage text-cafe-bg hover:bg-cafe-sage/90"
                  >
                    {isPardonPending ? "Saving..." : "Grant Pardon"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

