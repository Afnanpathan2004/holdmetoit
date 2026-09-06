"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  HeartHandshake,
  ListTodo,
  Plus,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminPardonAction } from "@/features/accountability/api/admin-pardon.action";
import {
  adminAddGoalAction,
  adminEditGoalAction,
} from "@/features/declarations/api/admin-goal.action";

export interface ParticipantWithGoalsAndPunishment {
  id: string;
  userId: string;
  displayName: string;
  teamName: string;
  status: "NORMAL" | "DEFICIT" | "EXCUSED" | "PUNISHED";
  goals: Array<{
    id: string;
    description: string;
    completed: boolean;
  }>;
  punishmentRecord?: {
    isPunished: boolean;
    isPardoned: boolean;
    pardonReason: string | null;
    hoursDeficitSeconds: number;
    incompleteGoalsCount: number;
  } | null;
}

interface AdminGoalsPardonsProps {
  challengeId: string;
  participants: ParticipantWithGoalsAndPunishment[];
}

export function AdminGoalsPardons({
  challengeId,
  participants,
}: AdminGoalsPardonsProps) {
  const [selectedGoal, setSelectedGoal] = useState<{
    id: string;
    participantId: string;
    participantName: string;
    description: string;
    completed: boolean;
  } | null>(null);

  const [addGoalFor, setAddGoalFor] = useState<{
    participantId: string;
    participantName: string;
  } | null>(null);

  const [pardonFor, setPardonFor] = useState<{
    participantId: string;
    participantName: string;
  } | null>(null);

  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [editGoalDesc, setEditGoalDesc] = useState("");
  const [editGoalCompleted, setEditGoalCompleted] = useState(false);
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openEditGoal = (
    pName: string,
    pId: string,
    goal: { id: string; description: string; completed: boolean },
  ) => {
    setSelectedGoal({
      id: goal.id,
      participantId: pId,
      participantName: pName,
      description: goal.description,
      completed: goal.completed,
    });
    setEditGoalDesc(goal.description);
    setEditGoalCompleted(goal.completed);
    setReason("");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const openAddGoal = (pId: string, pName: string) => {
    setAddGoalFor({ participantId: pId, participantName: pName });
    setNewGoalDesc("");
    setReason("");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const openPardon = (pId: string, pName: string) => {
    setPardonFor({ participantId: pId, participantName: pName });
    setReason("");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSaveEditGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    setErrorMsg(null);

    startTransition(async () => {
      const result = await adminEditGoalAction({
        challengeId,
        goalId: selectedGoal.id,
        description: editGoalDesc,
        completed: editGoalCompleted,
        reason,
      });

      if (result.ok) {
        setSuccessMsg("Goal updated successfully.");
        setTimeout(() => setSelectedGoal(null), 1200);
      } else {
        setErrorMsg(result.message);
      }
    });
  };

  const handleSaveAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addGoalFor) return;
    setErrorMsg(null);

    startTransition(async () => {
      const result = await adminAddGoalAction({
        challengeId,
        participantId: addGoalFor.participantId,
        description: newGoalDesc,
        reason,
      });

      if (result.ok) {
        setSuccessMsg("Goal added successfully.");
        setTimeout(() => setAddGoalFor(null), 1200);
      } else {
        setErrorMsg(result.message);
      }
    });
  };

  const handleSavePardon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pardonFor) return;
    setErrorMsg(null);

    startTransition(async () => {
      const result = await adminPardonAction({
        challengeId,
        participantId: pardonFor.participantId,
        reason,
      });

      if (result.ok) {
        setSuccessMsg("Participant excused/pardoned successfully.");
        setTimeout(() => setPardonFor(null), 1200);
      } else {
        setErrorMsg(result.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Weekly Goals Management Card */}
      <div className="rounded-2xl border border-cafe-border bg-cafe-card p-5 md:p-6 shadow-cafe">
        <div className="pb-4 border-b border-cafe-border">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-honey/15 text-cafe-honey">
              <ListTodo className="h-4 w-4" />
            </span>
            <h3 className="font-serif text-lg font-semibold text-cafe-parchment">
              Host Goal Unlock & Mid-Event Modifications
            </h3>
          </div>
          <p className="mt-1 text-xs text-cafe-oatmeal">
            Accommodate syllabus shifts, illness, or adjust task checklists mid-challenge with an audit reason (FEAT-DECL-04).
          </p>
        </div>

        <div className="mt-4 space-y-4">
          {participants.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-cafe-border/80 bg-cafe-bg/60 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm text-cafe-parchment">
                    {p.displayName}
                  </span>
                  <span className="ml-2 text-xs text-cafe-oatmeal">
                    ({p.teamName})
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAddGoal(p.id, p.displayName)}
                  className="h-8 min-h-[36px] text-xs gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Task</span>
                </Button>
              </div>

              <div className="mt-3 space-y-2">
                {p.goals.length === 0 ? (
                  <p className="text-xs text-cafe-ash italic">
                    No declared intentions for this participant.
                  </p>
                ) : (
                  p.goals.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between rounded-lg border border-cafe-border/50 bg-cafe-card/50 p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border ${
                            g.completed
                              ? "border-cafe-sage bg-cafe-sage text-cafe-bg"
                              : "border-cafe-border"
                          }`}
                        >
                          {g.completed && <Check className="h-3 w-3" />}
                        </span>
                        <span
                          className={
                            g.completed
                              ? "line-through text-cafe-ash"
                              : "text-cafe-linen"
                          }
                        >
                          {g.description}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditGoal(p.displayName, p.id, g)}
                        className="h-7 text-[11px] text-cafe-honey hover:text-cafe-honey-light"
                      >
                        Edit / Unlock
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Host Pardon / Excuse Card */}
      <div className="rounded-2xl border border-cafe-border bg-cafe-card p-5 md:p-6 shadow-cafe">
        <div className="pb-4 border-b border-cafe-border">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-honey/15 text-cafe-honey">
              <HeartHandshake className="h-4 w-4" />
            </span>
            <h3 className="font-serif text-lg font-semibold text-cafe-parchment">
              Host Pardon & Excuse Management
            </h3>
          </div>
          <p className="mt-1 text-xs text-cafe-oatmeal">
            Pardon participants facing unavoidable illness or emergencies from punishment avatar forfeits (FEAT-PUN-04).
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {participants.map((p) => {
            const isPunished =
              p.status === "PUNISHED" || p.punishmentRecord?.isPunished;
            const isPardoned =
              p.status === "EXCUSED" || p.punishmentRecord?.isPardoned;

            return (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-cafe-border/80 bg-cafe-bg/60 p-3.5 text-xs"
              >
                <div>
                  <span className="font-medium text-cafe-parchment">
                    {p.displayName}
                  </span>
                  <span className="ml-2 text-cafe-oatmeal">({p.teamName})</span>
                  <div className="mt-1">
                    {isPardoned ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-cafe-sage font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Pardoned / Excused ({p.punishmentRecord?.pardonReason || "Host excuse"})</span>
                      </span>
                    ) : isPunished ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-cafe-terracotta font-medium">
                        <ShieldAlert className="h-3 w-3" />
                        <span>Punished (Deficit / Incomplete Tasks)</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-cafe-ash">
                        Normal status (No active punishments)
                      </span>
                    )}
                  </div>
                </div>

                {!isPardoned && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openPardon(p.id, p.displayName)}
                    className="h-9 min-h-[44px] text-xs gap-1 text-cafe-honey"
                  >
                    <HeartHandshake className="h-3.5 w-3.5" />
                    <span>Pardon / Excuse</span>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Goal Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cafe-border bg-cafe-elevated p-6 shadow-cafe animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border">
              <h4 className="font-serif text-base font-semibold text-cafe-parchment">
                Edit / Unlock Weekly Goal
              </h4>
              <button
                type="button"
                onClick={() => setSelectedGoal(null)}
                className="text-cafe-ash hover:text-cafe-parchment p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditGoal} className="mt-4 space-y-4">
              <div>
                <span className="text-xs text-cafe-oatmeal">Participant:</span>
                <div className="font-medium text-sm text-cafe-parchment">
                  {selectedGoal.participantName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-cafe-linen mb-1">
                  Goal Description
                </label>
                <Input
                  type="text"
                  value={editGoalDesc}
                  onChange={(e) => setEditGoalDesc(e.target.value)}
                  required
                  className="bg-cafe-bg"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editGoalCompletedCheck"
                  checked={editGoalCompleted}
                  onChange={(e) => setEditGoalCompleted(e.target.checked)}
                  className="h-4 w-4 rounded border-cafe-border bg-cafe-bg text-cafe-honey accent-cafe-honey"
                />
                <label
                  htmlFor="editGoalCompletedCheck"
                  className="text-xs text-cafe-linen cursor-pointer"
                >
                  Mark as Completed
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-cafe-linen mb-1">
                  Audit Reason (Mandatory)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Syllabus adjusted by professor mid-week"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  minLength={3}
                  className="bg-cafe-bg"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-cafe-terracotta/40 bg-cafe-terracotta/10 p-3 text-xs text-cafe-parchment">
                  <AlertCircle className="h-4 w-4 text-cafe-terracotta shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-cafe-sage/40 bg-cafe-sage/10 p-3 text-xs text-cafe-parchment">
                  <CheckCircle2 className="h-4 w-4 text-cafe-sage shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedGoal(null)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !reason.trim()}
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {addGoalFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cafe-border bg-cafe-elevated p-6 shadow-cafe animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border">
              <h4 className="font-serif text-base font-semibold text-cafe-parchment">
                Add Weekly Goal (Host Override)
              </h4>
              <button
                type="button"
                onClick={() => setAddGoalFor(null)}
                className="text-cafe-ash hover:text-cafe-parchment p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddGoal} className="mt-4 space-y-4">
              <div>
                <span className="text-xs text-cafe-oatmeal">Participant:</span>
                <div className="font-medium text-sm text-cafe-parchment">
                  {addGoalFor.participantName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-cafe-linen mb-1">
                  New Goal Description
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Finish Physics Problem Set 4"
                  value={newGoalDesc}
                  onChange={(e) => setNewGoalDesc(e.target.value)}
                  required
                  className="bg-cafe-bg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cafe-linen mb-1">
                  Audit Reason (Mandatory)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Added replacement goal approved by host"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  minLength={3}
                  className="bg-cafe-bg"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-cafe-terracotta/40 bg-cafe-terracotta/10 p-3 text-xs text-cafe-parchment">
                  <AlertCircle className="h-4 w-4 text-cafe-terracotta shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-cafe-sage/40 bg-cafe-sage/10 p-3 text-xs text-cafe-parchment">
                  <CheckCircle2 className="h-4 w-4 text-cafe-sage shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAddGoalFor(null)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !reason.trim() || !newGoalDesc.trim()}
                >
                  {isPending ? "Adding..." : "Add Goal"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pardon Modal */}
      {pardonFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cafe-border bg-cafe-elevated p-6 shadow-cafe animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border">
              <h4 className="font-serif text-base font-semibold text-cafe-parchment flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-cafe-honey" />
                <span>Issue Host Pardon / Excuse</span>
              </h4>
              <button
                type="button"
                onClick={() => setPardonFor(null)}
                className="text-cafe-ash hover:text-cafe-parchment p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePardon} className="mt-4 space-y-4">
              <div>
                <span className="text-xs text-cafe-oatmeal">Participant:</span>
                <div className="font-medium text-sm text-cafe-parchment">
                  {pardonFor.participantName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-cafe-linen mb-1">
                  Excuse / Pardon Reason (Mandatory)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Medical emergency verified with doctor note"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  minLength={3}
                  className="bg-cafe-bg"
                />
                <span className="text-[11px] text-cafe-ash mt-1 block italic">
                  The member will be marked as EXCUSED on the Punishment Wall and relieved of forfeit obligations.
                </span>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-cafe-terracotta/40 bg-cafe-terracotta/10 p-3 text-xs text-cafe-parchment">
                  <AlertCircle className="h-4 w-4 text-cafe-terracotta shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-cafe-sage/40 bg-cafe-sage/10 p-3 text-xs text-cafe-parchment">
                  <CheckCircle2 className="h-4 w-4 text-cafe-sage shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPardonFor(null)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !reason.trim()}
                  className="bg-cafe-sage hover:bg-cafe-sage/90 text-cafe-bg"
                >
                  {isPending ? "Issuing Pardon..." : "Grant Pardon"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
