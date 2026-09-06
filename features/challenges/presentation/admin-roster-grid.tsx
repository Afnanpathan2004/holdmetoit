"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit3,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminEnrollParticipantAction } from "@/features/challenges/api/challenge-admin.actions";
import { adminOverrideStudyHoursAction } from "@/features/study-logs/api/admin-override.action";
import { formatSecondsToClock } from "@/features/study-logs/domain/duration";

export interface AdminRosterParticipant {
  id: string;
  userId: string;
  displayName: string;
  username: string | null;
  image: string | null;
  teamName: string;
  teamColor: string | null;
  teamIcon: string | null;
  targetSeconds: number;
  status: "NORMAL" | "DEFICIT" | "EXCUSED" | "PUNISHED";
  dailyLogs: Array<{
    id: string;
    logDate: string;
    durationSeconds: number;
    isOverride: boolean;
    overrideReason: string | null;
    overrideByUsername?: string | null;
  }>;
  goalsCount: number;
  goalsCompletedCount: number;
}

export interface AdminRosterTeamOption {
  id: string;
  name: string;
  color: string | null;
  iconEmoji: string | null;
  participantCount?: number;
}

export interface AdminAvailableUserOption {
  id: string;
  displayName: string;
  username: string | null;
  image: string | null;
  isEnrolled: boolean;
}

interface AdminRosterGridProps {
  challengeId: string;
  participants: AdminRosterParticipant[];
  teams?: AdminRosterTeamOption[];
  availableUsers?: AdminAvailableUserOption[];
}

export function AdminRosterGrid({
  challengeId,
  participants,
  teams,
  availableUsers,
}: AdminRosterGridProps) {
  const [selectedParticipant, setSelectedParticipant] =
    useState<AdminRosterParticipant | null>(null);
  const [overrideDate, setOverrideDate] = useState<string>("");
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Enroll modal state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollUserId, setEnrollUserId] = useState("");
  const [enrollTeamId, setEnrollTeamId] = useState("");
  const [enrollHours, setEnrollHours] = useState<number>(35);
  const [enrollReason, setEnrollReason] = useState<string>(
    "Manual host assignment",
  );
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const openOverrideModal = (
    participant: AdminRosterParticipant,
    initialDate?: string,
    initialSeconds?: number,
  ) => {
    setSelectedParticipant(participant);
    const dateToUse =
      initialDate || new Date().toISOString().split("T")[0];
    setOverrideDate(dateToUse);

    const secs = initialSeconds ?? 0;
    setHours(Math.floor(secs / 3600));
    setMinutes(Math.floor((secs % 3600) / 60));
    setSeconds(secs % 60);
    setReason("");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const closeOverrideModal = () => {
    setSelectedParticipant(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const result = await adminOverrideStudyHoursAction({
        challengeId,
        participantId: selectedParticipant.id,
        logDate: overrideDate,
        hours: Number(hours),
        minutes: Number(minutes),
        seconds: Number(seconds),
        reason,
      });

      if (result.ok) {
        setSuccessMsg("Hours override recorded successfully in audit trail.");
        setTimeout(() => {
          closeOverrideModal();
        }, 1200);
      } else {
        setErrorMsg(result.message);
      }
    });
  };

  const handleOpenEnrollModal = () => {
    const unenrolledUser = availableUsers?.find((u) => !u.isEnrolled);
    setEnrollUserId(unenrolledUser?.id || "");
    setEnrollTeamId(teams && teams.length > 0 ? teams[0].id : "");
    setEnrollHours(35);
    setEnrollReason("Manual host assignment");
    setEnrollError(null);
    setEnrollSuccess(null);
    setIsEnrollModalOpen(true);
  };

  const handleSaveEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollUserId || !enrollTeamId) {
      setEnrollError("Please select a user and a team.");
      return;
    }

    setEnrollError(null);
    setEnrollSuccess(null);

    startTransition(async () => {
      const res = await adminEnrollParticipantAction({
        challengeId,
        userId: enrollUserId,
        teamId: enrollTeamId,
        targetSeconds: enrollHours * 3600,
        reason: enrollReason,
      });

      if (res.ok) {
        setEnrollSuccess("Member enrolled successfully into tournament roster.");
        setTimeout(() => {
          setIsEnrollModalOpen(false);
        }, 1200);
      } else {
        setEnrollError(res.message);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-cafe-border bg-cafe-card p-5 md:p-6 shadow-cafe">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-cafe-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-honey/15 text-cafe-honey">
              <Users className="h-4 w-4" />
            </span>
            <h3 className="font-serif text-lg font-semibold text-cafe-parchment">
              Admin Inline Hours Override Grid
            </h3>
          </div>
          <p className="mt-1 text-xs text-cafe-oatmeal">
            Host authority to manually correct crashed timers, resolve disputes, and audit adjustments (Law L5 / FEAT-LOG-04).
          </p>
        </div>

        {teams && teams.length > 0 && (
          <Button
            type="button"
            onClick={handleOpenEnrollModal}
            className="min-h-[44px] gap-2 bg-cafe-honey text-cafe-bg hover:bg-cafe-honey-light font-semibold shadow-cafe shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Enroll Member</span>
          </Button>
        )}
      </div>

      {participants.length === 0 ? (
        <div className="py-12 text-center text-cafe-oatmeal text-sm">
          No participants enrolled in this challenge yet.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {participants.map((p) => {
            const totalLogged = p.dailyLogs.reduce(
              (acc, log) => acc + log.durationSeconds,
              0,
            );
            const totalLoggedClock = formatSecondsToClock(totalLogged);
            const targetClock = formatSecondsToClock(p.targetSeconds);

            return (
              <div
                key={p.id}
                className="rounded-xl border border-cafe-border/80 bg-cafe-bg/60 p-4 transition-colors hover:border-cafe-borderLight"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-cafe-border bg-cafe-card">
                      {p.image ? (
                        <Image
                          src={p.image}
                          alt={p.displayName}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-cafe-honey">
                          {p.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-cafe-parchment">
                          {p.displayName}
                        </span>
                        {p.username && (
                          <span className="text-xs text-cafe-ash font-mono">
                            @{p.username}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border border-cafe-border bg-cafe-card text-cafe-linen">
                          {p.teamIcon && <span>{p.teamIcon}</span>}
                          <span>{p.teamName}</span>
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-cafe-oatmeal">
                        <span>
                          Logged: <strong className="font-mono text-cafe-honey">{totalLoggedClock}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Target: <span className="font-mono text-cafe-linen">{targetClock}</span>
                        </span>
                        <span>•</span>
                        <span>
                          Goals: {p.goalsCompletedCount}/{p.goalsCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openOverrideModal(p)}
                      className="min-h-[44px] h-9 gap-1.5 text-xs text-cafe-honey hover:text-cafe-honey-light"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Adjust Hours</span>
                    </Button>
                  </div>
                </div>

                {/* Daily log entries breakdown */}
                {p.dailyLogs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-cafe-border/40 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {p.dailyLogs.map((log) => {
                      const clock = formatSecondsToClock(log.durationSeconds);
                      return (
                        <button
                          key={log.id}
                          type="button"
                          onClick={() =>
                            openOverrideModal(p, log.logDate, log.durationSeconds)
                          }
                          className={`rounded-lg border p-2 text-left transition-colors cursor-pointer hover:bg-cafe-wood ${
                            log.isOverride
                              ? "border-cafe-honey/60 bg-cafe-honey/10"
                              : "border-cafe-border/50 bg-cafe-card/40"
                          }`}
                        >
                          <div className="text-[10px] text-cafe-ash font-mono">
                            {log.logDate}
                          </div>
                          <div className="font-mono text-xs font-medium text-cafe-parchment mt-0.5">
                            {clock}
                          </div>
                          {log.isOverride && (
                            <div className="mt-1 flex items-center gap-1 text-[9px] text-cafe-honey font-semibold">
                              <ShieldCheck className="h-3 w-3" />
                              <span>OVERRIDE</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Override Dialog / Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cafe-border bg-cafe-elevated p-6 shadow-cafe animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border">
              <h4 className="font-serif text-base font-semibold text-cafe-parchment flex items-center gap-2">
                <Clock className="h-4 w-4 text-cafe-honey" />
                <span>Host Hours Override</span>
              </h4>
              <button
                type="button"
                onClick={closeOverrideModal}
                className="text-cafe-ash hover:text-cafe-parchment text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOverride} className="mt-4 space-y-4">
              <div>
                <span className="text-xs text-cafe-oatmeal">Participant:</span>
                <div className="font-medium text-sm text-cafe-parchment">
                  {selectedParticipant.displayName} ({selectedParticipant.teamName})
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-cafe-linen mb-1">
                  Log Date
                </label>
                <Input
                  type="date"
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  required
                  className="bg-cafe-bg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cafe-linen mb-1">
                  Adjusted Study Duration (HH:MM:SS)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-cafe-ash">Hours (0-24)</span>
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                      required
                      className="font-mono text-center bg-cafe-bg"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-cafe-ash">Minutes (0-59)</span>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={minutes}
                      onChange={(e) => setMinutes(Number(e.target.value))}
                      required
                      className="font-mono text-center bg-cafe-bg"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-cafe-ash">Seconds (0-59)</span>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={seconds}
                      onChange={(e) => setSeconds(Number(e.target.value))}
                      required
                      className="font-mono text-center bg-cafe-bg"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-cafe-linen mb-1">
                  Audit Reason (Mandatory)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Mobile timer app crash, verified with screenshots"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  minLength={3}
                  className="bg-cafe-bg"
                />
                <span className="text-[11px] text-cafe-ash mt-1 block italic">
                  This note will be permanently recorded in the immutable audit trail.
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
                  onClick={closeOverrideModal}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !reason.trim()}
                  className="gap-2"
                >
                  {isPending ? "Saving Override..." : "Save Override"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Enroll Member Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cafe-border bg-cafe-elevated p-6 shadow-cafe animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border">
              <h4 className="font-serif text-base font-semibold text-cafe-parchment flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-cafe-honey" />
                <span>Assign Member to Challenge</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-cafe-ash hover:text-cafe-parchment text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEnrollment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-cafe-linen mb-1">
                  Select Registered User
                </label>
                {availableUsers && availableUsers.length > 0 ? (
                  <select
                    value={enrollUserId}
                    onChange={(e) => setEnrollUserId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-cafe-border bg-cafe-bg px-3 py-2 text-sm text-cafe-parchment focus:border-cafe-honey focus:outline-none"
                  >
                    <option value="" disabled>
                      Select a user...
                    </option>
                    {availableUsers.map((u) => (
                      <option
                        key={u.id}
                        value={u.id}
                        disabled={u.isEnrolled}
                      >
                        {u.displayName} {u.username ? `(@${u.username})` : ""}{" "}
                        {u.isEnrolled ? "— Already Enrolled" : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-xl border border-cafe-border bg-cafe-bg/60 p-3 text-xs text-cafe-oatmeal">
                    No registered users found. Users must log in with Discord once to appear in the platform roster.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-cafe-linen mb-1">
                  Assign House / Team
                </label>
                <select
                  value={enrollTeamId}
                  onChange={(e) => setEnrollTeamId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-cafe-border bg-cafe-bg px-3 py-2 text-sm text-cafe-parchment focus:border-cafe-honey focus:outline-none"
                >
                  <option value="" disabled>
                    Select a team...
                  </option>
                  {teams?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.iconEmoji || "🛡️"} {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-cafe-linen mb-1">
                  Weekly Target (Hours)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={168}
                  value={enrollHours}
                  onChange={(e) => setEnrollHours(Math.max(1, Number(e.target.value)))}
                  required
                  className="bg-cafe-bg font-mono"
                />
                <span className="text-[11px] text-cafe-ash mt-1 block">
                  Standard weekly baseline is 35 hours (5h/day).
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-cafe-linen mb-1">
                  Audit Reason (Mandatory)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Host roster placement / Discord signup"
                  value={enrollReason}
                  onChange={(e) => setEnrollReason(e.target.value)}
                  required
                  minLength={3}
                  className="bg-cafe-bg"
                />
                <span className="text-[11px] text-cafe-ash mt-1 block italic">
                  Recorded in the immutable host audit trail (Law L5).
                </span>
              </div>

              {enrollError && (
                <div className="flex items-center gap-2 rounded-xl border border-cafe-terracotta/40 bg-cafe-terracotta/10 p-3 text-xs text-cafe-parchment">
                  <AlertCircle className="h-4 w-4 text-cafe-terracotta shrink-0" />
                  <span>{enrollError}</span>
                </div>
              )}

              {enrollSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-cafe-sage/40 bg-cafe-sage/10 p-3 text-xs text-cafe-parchment">
                  <CheckCircle2 className="h-4 w-4 text-cafe-sage shrink-0" />
                  <span>{enrollSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEnrollModalOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isPending ||
                    !enrollUserId ||
                    !enrollTeamId ||
                    !enrollReason.trim()
                  }
                  className="gap-2 bg-cafe-honey text-cafe-bg hover:bg-cafe-honey-light font-semibold shadow-cafe"
                >
                  {isPending ? "Enrolling..." : "Enroll Member"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
