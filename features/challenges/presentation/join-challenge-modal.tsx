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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#262626] bg-[#141414] p-4 text-xs shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#292929] text-[#ffffff] border border-[#333333]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-sm text-[#ffffff]">
              Join {challengeTitle}
            </p>
            <p className="text-[11px] text-[#868686]">
              Choose a house and declare your study hours before kickoff.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsOpen(true)}
          className="min-h-[40px] px-5 font-bold bg-[#ffffff] text-[#0d0d0d] hover:bg-[#e0e0e0]"
        >
          <span>Enroll Now</span>
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          {/* Modal Container: Figma 93:584 Rectangle 12 (fill #292929, cornerRadius 20) */}
          <div className="w-full max-w-md rounded-[20px] border border-[#383838] bg-[#292929] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#383838]">
              <div>
                <h3 className="text-base font-bold text-[#ffffff]">
                  So how many hours can you put in?
                </h3>
                <p className="text-xs text-[#868686] mt-0.5">
                  Declare your target weekly study commitment
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#868686] hover:text-[#ffffff] p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnroll} className="space-y-4">
              {/* Select Team */}
              <div>
                <label className="block text-xs font-semibold text-[#d1d1d1] mb-2">
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
                          ? "border-[#ffffff] bg-[#3a3a3a] text-[#ffffff] ring-1 ring-white/50"
                          : "border-[#383838] bg-[#1c1c1c] text-[#d1d1d1] hover:bg-[#333333]"
                      }`}
                    >
                      <span className="text-xl">{t.iconEmoji || "🛡️"}</span>
                      <span className="font-semibold text-xs truncate">
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Hours Inputs: Figma 131:671 fill #545454 */}
              <div>
                <label className="block text-xs font-semibold text-[#d1d1d1] mb-1">
                  Weekly Study Target (HH:MM)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] text-[#868686]">Hours (1–105)</span>
                    <input
                      type="number"
                      min={1}
                      max={105}
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                      required
                      placeholder="Enter hours..."
                      className="w-full h-11 rounded-xl border border-[#484848] bg-[#545454] px-3 text-center font-sans font-sans-tabular text-[#ffffff] text-sm outline-none focus:border-[#ffffff]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#868686]">Minutes (0–59)</span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={minutes}
                      onChange={(e) => setMinutes(Number(e.target.value))}
                      required
                      placeholder="Enter minutes..."
                      className="w-full h-11 rounded-xl border border-[#484848] bg-[#545454] px-3 text-center font-sans font-sans-tabular text-[#ffffff] text-sm outline-none focus:border-[#ffffff]"
                    />
                  </div>
                </div>
                <span className="text-[11px] text-[#868686] mt-1.5 block">
                  You can refine target hours and intentions before the host triggers kickoff.
                </span>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-[#ef4444]/40 bg-[#401010]/30 p-3 text-xs text-[#ff5757]">
                  {errorMsg}
                </div>
              )}

              {/* Actions: Figma 93:593 Cancel (#4a4a4a) & 93:594 Submit (#ffffff text #000000) */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#383838]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="h-10 px-5 rounded-xl bg-[#4a4a4a] text-xs font-semibold text-[#ffffff] hover:bg-[#555555] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !selectedTeamId}
                  className="h-10 px-6 rounded-xl bg-[#ffffff] text-xs font-bold text-[#000000] hover:bg-[#e0e0e0] transition-colors disabled:opacity-50"
                >
                  {isPending ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
