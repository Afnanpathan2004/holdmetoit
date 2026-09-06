"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock, Sparkles, Trophy, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { enrollInChallengeAction } from "@/features/challenges/api/enroll-participant.action";

interface JoinChallengeModalProps {
  challengeId: string;
  challengeTitle: string;
  format: "TEAM_VS_TEAM" | "DUOS" | "SOLOS";
  teams: Array<{
    id: string;
    name: string;
    color: string | null;
    iconEmoji: string | null;
  }>;
}

export function JoinChallengeModal({
  challengeId,
  challengeTitle,
  format,
  teams,
}: JoinChallengeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    teams[0]?.id ?? "",
  );
  const [hours, setHours] = useState<number>(35);
  const [minutes, setMinutes] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setErrorMsg("Please select a team to join.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await enrollInChallengeAction({
        challengeId,
        teamId: selectedTeamId,
        hours: Number(hours),
        minutes: Number(minutes),
        seconds: 0,
      });

      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-cafe-honey/40 bg-cafe-elevated/90 p-4 text-xs shadow-cafe">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cafe-honey/20 text-cafe-honey text-lg">
            ✨
          </span>
          <div>
            <p className="font-serif font-semibold text-sm text-cafe-parchment">
              Join the {challengeTitle} Sprint
            </p>
            <p className="text-[11px] text-cafe-oatmeal">
              You are signed in as a spectator. Ready to pick a house and declare your study goals?
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsOpen(true)}
          className="min-h-[44px] gap-2 font-semibold bg-cafe-honey text-cafe-bg hover:bg-cafe-honey-light shadow"
        >
          <Sparkles className="h-4 w-4" />
          <span>Join Sprint / Choose Team</span>
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-cafe-border bg-cafe-elevated p-6 shadow-cafe">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-cafe-honey" />
                <h3 className="font-serif text-base font-semibold text-cafe-parchment">
                  Join Competition Sprint
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-cafe-ash hover:text-cafe-parchment p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnroll} className="mt-4 space-y-4">
              {/* Select Team */}
              <div>
                <label className="block text-xs font-medium text-cafe-linen mb-2">
                  Select Your House / Team *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTeamId(t.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        selectedTeamId === t.id
                          ? "border-cafe-honey bg-cafe-honey/15 text-cafe-parchment ring-1 ring-cafe-honey"
                          : "border-cafe-border bg-cafe-bg/60 text-cafe-linen hover:bg-cafe-wood"
                      }`}
                    >
                      <span className="text-xl">{t.iconEmoji || "🛡️"}</span>
                      <span className="font-medium text-xs truncate">
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial Target Hours */}
              <div>
                <label className="block text-xs font-medium text-cafe-linen mb-1">
                  Weekly Study Target (HH:MM)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-cafe-ash">Hours (1–105)</span>
                    <Input
                      type="number"
                      min={1}
                      max={105}
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                      required
                      className="font-mono text-center bg-cafe-bg"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-cafe-ash">Minutes (0–59)</span>
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
                </div>
                <span className="text-[11px] text-cafe-ash mt-1 block">
                  You can fine-tune target hours and weekly tasks before the host triggers kickoff.
                </span>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-cafe-terracotta/40 bg-cafe-terracotta/10 p-3 text-xs text-cafe-parchment">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !selectedTeamId}
                  className="gap-2 bg-cafe-honey text-cafe-bg hover:bg-cafe-honey-light"
                >
                  {isPending ? "Enrolling..." : "Confirm & Join Sprint"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
