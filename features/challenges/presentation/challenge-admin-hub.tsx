"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  Shield,
  Clock,
  Play,
  Lock,
  Copy,
  Check,
  UserPlus,
  Edit2,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Eye,
  FileText,
  History,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  kickoffChallengeAction,
  finalizeChallengeAction,
  enrollParticipantAction,
  renameDuoTeamAction,
} from "@/features/challenges/api/challenge-admin.actions";
import { generateDiscordSummary } from "@/features/discord/domain/discord-summary";
import { evaluateParticipantPunishment } from "@/features/accountability/domain/punishment";
import { rankParticipants } from "@/features/leaderboard/domain/standings";
import { calculateLeadMargin } from "@/features/leaderboard/domain/leaderboard";
import { formatSecondsToClock } from "@/features/study-logs/domain/duration";

export interface AdminHubUserOption {
  id: string;
  name: string | null;
  displayName: string | null;
  username: string | null;
  image: string | null;
}

export interface AdminHubParticipant {
  id: string;
  userId: string;
  teamId: string;
  targetSeconds: number;
  status: string;
  createdAt: string | Date;
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
    durationSeconds: number;
    logDate: string;
    isOverride: boolean;
  }[];
  weeklyGoals: {
    id: string;
    description: string;
    completed: boolean;
  }[];
  punishmentRecord?: {
    isPunished: boolean;
    isPardoned: boolean;
    pardonReason?: string | null;
  } | null;
}

export interface AdminHubTeam {
  id: string;
  name: string;
  color: string | null;
  iconEmoji: string | null;
  maxMembers: number | null;
  sortOrder: number;
}

export interface AdminHubAuditLog {
  id: string;
  timestamp: string | Date;
  actorUsername: string;
  actionType: string;
  targetEntityType: string;
  auditReason: string | null;
}

export interface ChallengeAdminHubProps {
  challenge: {
    id: string;
    title: string;
    format: "TEAM_VS_TEAM" | "DUOS" | "SOLOS";
    status: "UPCOMING" | "ACTIVE" | "COMPLETED";
    startAt: string | Date;
    endAt: string | Date;
    punishmentPfpUrl: string | null;
    teams: AdminHubTeam[];
    participants: AdminHubParticipant[];
  };
  allUsers: AdminHubUserOption[];
  auditLogs: AdminHubAuditLog[];
}

export function ChallengeAdminHub({
  challenge,
  allUsers,
  auditLogs,
}: ChallengeAdminHubProps) {
  // State for status actions
  const [isKickoffPending, setIsKickoffPending] = useState(false);
  const [isFinalizePending, setIsFinalizePending] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // State for Discord Summary
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);

  // State for Enrollment Form
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    challenge.teams[0]?.id ?? "",
  );
  const [targetClockInput, setTargetClockInput] = useState("35:00:00");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  // State for Duo Renaming Modal
  const [renamingTeamId, setRenamingTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [renameReason, setRenameReason] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  // Filter users available for enrollment (exclude already enrolled)
  const enrolledUserIds = new Set(challenge.participants.map((p) => p.userId));
  const availableUsers = allUsers.filter((u) => !enrolledUserIds.has(u.id));

  // Compute stats and Discord summary payload
  const participantStandingInputs = challenge.participants.map((p) => {
    const totalLoggedSeconds = p.dailyStudyLogs.reduce(
      (sum, log) => sum + log.durationSeconds,
      0,
    );
    const completedGoalsCount = p.weeklyGoals.filter((g) => g.completed).length;
    return {
      id: p.id,
      totalLoggedSeconds,
      targetSeconds: p.targetSeconds,
      enrolledAt: new Date(p.createdAt),
      completedGoalsCount,
      totalGoalsCount: p.weeklyGoals.length,
      participant: p,
    };
  });

  const ranked = rankParticipants(participantStandingInputs);

  const teamTotals = challenge.teams.map((t) => {
    const teamParticipants = challenge.participants.filter(
      (p) => p.teamId === t.id,
    );
    const totalSeconds = teamParticipants.reduce(
      (acc, p) =>
        acc +
        p.dailyStudyLogs.reduce((sum, log) => sum + log.durationSeconds, 0),
      0,
    );
    return {
      id: t.id,
      name: t.name,
      iconEmoji: t.iconEmoji,
      totalSeconds,
      memberCount: teamParticipants.length,
    };
  });

  // Calculate lead margin if 2 teams
  let leadMargin = null;
  if (teamTotals.length >= 2) {
    const marginRes = calculateLeadMargin(
      teamTotals[0].totalSeconds,
      teamTotals[1].totalSeconds,
    );
    leadMargin = {
      marginSeconds: marginRes.marginSeconds,
      leader: marginRes.leader,
      leadingTeam:
        marginRes.leader === "a"
          ? { name: teamTotals[0].name }
          : marginRes.leader === "b"
          ? { name: teamTotals[1].name }
          : null,
      isTie: marginRes.leader === "tie",
    };
  }

  const discordSummaryPayload = {
    challenge: {
      id: challenge.id,
      title: challenge.title,
      format: challenge.format,
      status: challenge.status,
      startAt: new Date(challenge.startAt),
      endAt: new Date(challenge.endAt),
      punishmentPfpUrl: challenge.punishmentPfpUrl,
    },
    teams: teamTotals,
    leadMargin,
    participants: ranked.map((r) => {
      const p = r.item.participant;
      const goals = p.weeklyGoals.map((g) => ({ completed: g.completed }));
      const punishmentEval = evaluateParticipantPunishment(
        p.targetSeconds,
        r.item.totalLoggedSeconds,
        goals,
      );
      return {
        id: p.id,
        displayName: p.user.displayName ?? p.user.name ?? "Student",
        username: p.user.username ?? p.user.name ?? "student",
        teamName: p.team.name,
        totalLoggedSeconds: r.item.totalLoggedSeconds,
        targetSeconds: p.targetSeconds,
        progressPercent: r.progressPercent,
        rank: r.rank,
        completedGoalsCount: r.item.completedGoalsCount,
        totalGoalsCount: r.item.totalGoalsCount,
        punishmentEvaluation: punishmentEval,
        punishmentRecord: p.punishmentRecord
          ? {
              isPardoned: p.punishmentRecord.isPardoned,
              pardonReason: p.punishmentRecord.pardonReason,
            }
          : null,
      };
    }),
  };

  const generatedMarkdown = generateDiscordSummary(discordSummaryPayload);

  const handleCopyDiscordSummary = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedMarkdown);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 3000);
      } else {
        setShowMarkdownPreview(true);
      }
    } catch {
      setShowMarkdownPreview(true);
    }
  };

  const handleKickoff = async () => {
    if (challenge.participants.length === 0) {
      setActionError("Cannot kickoff challenge: At least 1 participant must be enrolled.");
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    setIsKickoffPending(true);

    const res = await kickoffChallengeAction(challenge.id);
    setIsKickoffPending(false);

    if (!res.ok) {
      setActionError(res.error);
    } else {
      setActionSuccess("Challenge kickoff successful! Goals & target hours are locked.");
    }
  };

  const handleFinalize = async () => {
    setActionError(null);
    setActionSuccess(null);
    setIsFinalizePending(true);

    const res = await finalizeChallengeAction(challenge.id);
    setIsFinalizePending(false);
    setShowFinalizeConfirm(false);

    if (!res.ok) {
      setActionError(res.error);
    } else {
      setActionSuccess("Challenge finalized! Dual-failure punishments evaluated and results locked.");
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setEnrollError("Please select a user to enroll.");
      return;
    }
    if (!selectedTeamId) {
      setEnrollError("Please select a house team.");
      return;
    }

    setEnrollError(null);
    setIsEnrolling(true);

    const res = await enrollParticipantAction({
      challengeId: challenge.id,
      userId: selectedUserId,
      teamId: selectedTeamId,
      targetClock: targetClockInput,
    });

    setIsEnrolling(false);

    if (!res.ok) {
      setEnrollError(res.error);
    } else {
      setSelectedUserId("");
    }
  };

  const handleRenameTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingTeamId || !newTeamName.trim()) return;

    setRenameError(null);
    setIsRenaming(true);

    const res = await renameDuoTeamAction({
      challengeId: challenge.id,
      teamId: renamingTeamId,
      newName: newTeamName.trim(),
      reason: renameReason.trim() || undefined,
    });

    setIsRenaming(false);

    if (!res.ok) {
      setRenameError(res.error);
    } else {
      setRenamingTeamId(null);
      setNewTeamName("");
      setRenameReason("");
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner Card */}
      <div className="rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-cafe-border bg-cafe-wood px-3 py-1 text-xs font-semibold text-cafe-linen">
              {challenge.format}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                challenge.status === "ACTIVE"
                  ? "border-cafe-sage/40 bg-cafe-sage-surface text-cafe-parchment"
                  : challenge.status === "UPCOMING"
                  ? "border-cafe-border bg-cafe-wood text-cafe-honey-light"
                  : "border-cafe-border bg-cafe-wood text-cafe-oatmeal"
              }`}
            >
              Status: {challenge.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/challenges/${challenge.id}/roster`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-cafe-wood px-4 py-2 text-xs font-semibold text-cafe-parchment hover:bg-cafe-elevated transition-colors"
            >
              <Clock className="size-4 text-cafe-honey" />
              <span>Hours Override & Roster</span>
            </Link>

            <Link
              href={`/challenge/${challenge.id}`}
              target="_blank"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-cafe-border px-3.5 py-2 text-xs font-medium text-cafe-linen hover:bg-cafe-wood transition-colors"
            >
              <ExternalLink className="size-3.5" />
              <span>Scoreboard View</span>
            </Link>
          </div>
        </div>

        <h1 className="mt-4 font-serif text-2xl font-bold tracking-tight text-cafe-parchment sm:text-3xl">
          {challenge.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-cafe-oatmeal">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-4" />
            {new Date(challenge.startAt).toLocaleDateString()} –{" "}
            {new Date(challenge.endAt).toLocaleDateString()}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" />
            {challenge.participants.length} Enrolled Participant
            {challenge.participants.length === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Shield className="size-4" />
            {challenge.teams.length} House Teams
          </span>
        </div>

        {actionError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-cafe-terracotta/40 bg-cafe-terracotta-surface p-3 text-xs text-cafe-parchment">
            <AlertCircle className="size-4 shrink-0 text-cafe-terracotta" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-cafe-sage/40 bg-cafe-sage-surface p-3 text-xs text-cafe-parchment">
            <Check className="size-4 shrink-0 text-cafe-sage" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Primary Operational Controls */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-cafe-border pt-6">
          {/* Kickoff Button */}
          {challenge.status === "UPCOMING" && (
            <Button
              onClick={handleKickoff}
              disabled={isKickoffPending}
              className="min-h-[44px] gap-2 bg-cafe-honey text-cafe-bg hover:bg-cafe-honey-light"
            >
              <Play className="size-4" />
              <span>
                {isKickoffPending ? "Triggering Kickoff..." : "Kickoff Challenge Now"}
              </span>
            </Button>
          )}

          {/* Lock Results Button */}
          {challenge.status === "ACTIVE" && (
            <Button
              onClick={() => setShowFinalizeConfirm(true)}
              disabled={isFinalizePending}
              className="min-h-[44px] gap-2 border border-cafe-terracotta/40 bg-cafe-terracotta-surface text-cafe-parchment hover:bg-cafe-wood"
            >
              <Lock className="size-4 text-cafe-terracotta" />
              <span>Lock Final Results (Evaluate Punishments)</span>
            </Button>
          )}

          {/* 1-Click Discord Summary Copy (FEAT-DISC-01) */}
          <Button
            onClick={handleCopyDiscordSummary}
            variant="secondary"
            className="min-h-[44px] gap-2"
          >
            {copiedSummary ? (
              <>
                <Check className="size-4 text-cafe-sage" />
                <span className="text-cafe-sage">Summary Copied!</span>
              </>
            ) : (
              <>
                <Copy className="size-4 text-cafe-honey" />
                <span>1-Click Discord Summary</span>
              </>
            )}
          </Button>

          <Button
            onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
            variant="outline"
            className="min-h-[44px] gap-2"
          >
            <Eye className="size-4" />
            <span>{showMarkdownPreview ? "Hide Preview" : "Preview Markdown"}</span>
          </Button>
        </div>
      </div>

      {/* Confirmation Modal for Finalize */}
      {showFinalizeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe">
            <div className="flex items-center gap-2 text-cafe-terracotta">
              <AlertCircle className="size-5" />
              <h3 className="font-serif text-lg font-bold text-cafe-parchment">
                Finalize Challenge Results?
              </h3>
            </div>
            <p className="mt-3 text-xs text-cafe-oatmeal">
              This action will permanently lock the challenge and execute the{" "}
              <strong>Dual-Failure Invariant (Law L6)</strong>: any participant who
              did not meet their target hours OR left incomplete declared goals will
              be flagged as <strong>PUNISHED</strong>.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFinalizeConfirm(false)}
                disabled={isFinalizePending}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFinalize}
                disabled={isFinalizePending}
                className="min-h-[44px] bg-cafe-terracotta text-cafe-parchment hover:bg-cafe-terracotta/90"
              >
                {isFinalizePending ? "Freezing..." : "Yes, Finalize Results"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Discord Markdown Preview Accordion/Drawer */}
      {showMarkdownPreview && (
        <section className="space-y-3 rounded-3xl border border-cafe-border bg-cafe-wood p-6 shadow-cafe">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-cafe-honey" />
              <h3 className="font-serif text-base font-semibold text-cafe-parchment">
                Discord Summary Markdown Preview
              </h3>
            </div>
            <Button
              size="sm"
              onClick={handleCopyDiscordSummary}
              className="min-h-[36px] gap-1.5"
            >
              <Copy className="size-3.5" />
              <span>{copiedSummary ? "Copied!" : "Copy Raw Markdown"}</span>
            </Button>
          </div>
          <pre className="max-h-72 overflow-y-auto rounded-2xl border border-cafe-border bg-cafe-bg p-4 font-mono text-xs text-cafe-linen whitespace-pre-wrap">
            {generatedMarkdown}
          </pre>
        </section>
      )}

      {/* House Teams & Duo Customization Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-cafe-parchment">
              House Teams & Rosters
            </h2>
            <p className="text-xs text-cafe-oatmeal">
              {challenge.format === "DUOS"
                ? "Duo partners may customize house names (FEAT-CHAL-06)."
                : "Configured teams for this event."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenge.teams.map((t) => {
            const members = challenge.participants.filter(
              (p) => p.teamId === t.id,
            );
            return (
              <div
                key={t.id}
                className="flex flex-col justify-between rounded-3xl border border-cafe-border bg-cafe-card p-5 shadow-cafe"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{t.iconEmoji ?? "🛡️"}</span>
                      <h3 className="font-serif text-base font-bold text-cafe-parchment">
                        {t.name}
                      </h3>
                    </div>
                    {challenge.format === "DUOS" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRenamingTeamId(t.id);
                          setNewTeamName(t.name);
                        }}
                        className="h-8 px-2 text-xs text-cafe-oatmeal hover:text-cafe-honey-light"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-cafe-oatmeal">
                    Capacity: {members.length} /{" "}
                    {t.maxMembers ? t.maxMembers : "Unlimited"}
                  </div>

                  {/* Members list */}
                  <div className="mt-4 space-y-2">
                    {members.length === 0 ? (
                      <p className="text-xs italic text-cafe-ash">
                        No members assigned yet
                      </p>
                    ) : (
                      members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between rounded-xl border border-cafe-border bg-cafe-wood px-3 py-2 text-xs"
                        >
                          <span className="font-medium text-cafe-parchment">
                            {m.user.displayName ?? m.user.name}
                          </span>
                          <span className="font-mono text-cafe-oatmeal">
                            {formatSecondsToClock(m.targetSeconds)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Duo Team Renaming Modal */}
      {renamingTeamId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe">
            <h3 className="font-serif text-lg font-bold text-cafe-parchment">
              Customize Duo House Name (FEAT-CHAL-06)
            </h3>
            <p className="mt-1 text-xs text-cafe-oatmeal">
              Provide a memorable identity for this duo partnership.
            </p>

            {renameError && (
              <p className="mt-3 text-xs text-cafe-terracotta">{renameError}</p>
            )}

            <form onSubmit={handleRenameTeam} className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-cafe-linen">Team Name</label>
                <Input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Caffeine & Code"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-cafe-linen">Audit Reason (Optional)</label>
                <Input
                  value={renameReason}
                  onChange={(e) => setRenameReason(e.target.value)}
                  placeholder="e.g. Partners requested new identity"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRenamingTeamId(null)}
                  disabled={isRenaming}
                  className="min-h-[44px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isRenaming}
                  className="min-h-[44px]"
                >
                  {isRenaming ? "Saving..." : "Save Identity"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participant Enrollment Panel */}
      {challenge.status !== "COMPLETED" && (
        <section className="rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe">
          <div className="flex items-center gap-2 border-b border-cafe-border pb-4">
            <UserPlus className="size-5 text-cafe-honey" />
            <div>
              <h2 className="font-serif text-lg font-semibold text-cafe-parchment">
                Enroll Participant
              </h2>
              <p className="text-xs text-cafe-oatmeal">
                Assign community members to house teams and configure initial targets.
              </p>
            </div>
          </div>

          {availableUsers.length === 0 ? (
            <p className="mt-4 text-xs italic text-cafe-oatmeal">
              All registered users in the database are already enrolled in this challenge.
            </p>
          ) : (
            <form onSubmit={handleEnroll} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs text-cafe-linen">User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="mt-1 flex h-11 min-h-[44px] w-full rounded-xl border border-cafe-border bg-cafe-bg px-3 py-2 text-xs text-cafe-parchment shadow-inner outline-none focus:border-cafe-honey/80"
                  required
                >
                  <option value="">Select a user...</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.displayName ?? u.name} (@{u.username ?? u.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-cafe-linen">House Team</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="mt-1 flex h-11 min-h-[44px] w-full rounded-xl border border-cafe-border bg-cafe-bg px-3 py-2 text-xs text-cafe-parchment shadow-inner outline-none focus:border-cafe-honey/80"
                  required
                >
                  {challenge.teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.iconEmoji ?? "🛡️"} {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-cafe-linen">Target Hours (HH:MM:SS)</label>
                <Input
                  value={targetClockInput}
                  onChange={(e) => setTargetClockInput(e.target.value)}
                  placeholder="35:00:00"
                  className="mt-1"
                />
              </div>

              {enrollError && (
                <div className="col-span-full text-xs text-cafe-terracotta">
                  {enrollError}
                </div>
              )}

              <div className="col-span-full">
                <Button
                  type="submit"
                  disabled={isEnrolling}
                  className="min-h-[44px] gap-2"
                >
                  <UserPlus className="size-4" />
                  <span>{isEnrolling ? "Enrolling..." : "Enroll Participant"}</span>
                </Button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* Challenge Audit Trail Section */}
      <section className="space-y-4 rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe">
        <div className="flex items-center justify-between border-b border-cafe-border pb-4">
          <div className="flex items-center gap-2">
            <History className="size-5 text-cafe-honey" />
            <h2 className="font-serif text-lg font-semibold text-cafe-parchment">
              Challenge Audit Trail (FEAT-AUDIT-01)
            </h2>
          </div>
          <span className="text-xs text-cafe-oatmeal">Append-Only Immutability</span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-cafe-oatmeal">No audit events recorded for this challenge yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Challenge Audit Trail">
              <thead className="border-b border-cafe-border text-cafe-oatmeal uppercase">
                <tr>
                  <th scope="col" className="pb-3 pr-4">Timestamp</th>
                  <th scope="col" className="pb-3 pr-4">Actor</th>
                  <th scope="col" className="pb-3 pr-4">Action</th>
                  <th scope="col" className="pb-3 pr-4">Entity</th>
                  <th scope="col" className="pb-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-border text-cafe-linen">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-cafe-wood/40">
                    <td className="whitespace-nowrap py-3 pr-4 font-mono text-[11px] text-cafe-oatmeal">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 font-medium text-cafe-parchment">
                      {log.actorUsername}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4">
                      <span className="rounded bg-cafe-wood px-2 py-0.5 font-mono text-[10px] text-cafe-honey-light">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-cafe-oatmeal">
                      {log.targetEntityType}
                    </td>
                    <td className="py-3 text-cafe-parchment">
                      {log.auditReason ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

