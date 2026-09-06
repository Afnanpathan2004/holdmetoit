"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createChallengeAction } from "@/features/challenges/api/challenge-admin.actions";

interface TeamField {
  name: string;
  iconEmoji: string;
  color: string;
}

export function ChallengeCreatorForm() {
  const router = useRouter();

  // Initialize start/end dates (today to today + 7 days)
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const formatIsoForInput = (d: Date) => d.toISOString().slice(0, 16);

  const [title, setTitle] = useState("Autumn Study Duel");
  const [format, setFormat] = useState<"TEAM_VS_TEAM" | "DUOS" | "SOLOS">("TEAM_VS_TEAM");
  const [startAt, setStartAt] = useState(formatIsoForInput(now));
  const [endAt, setEndAt] = useState(formatIsoForInput(nextWeek));
  const [punishmentPfpUrl, setPunishmentPfpUrl] = useState("");

  const [teams, setTeams] = useState<TeamField[]>([
    { name: "Honey Bees", iconEmoji: "🐝", color: "#ebb06e" },
    { name: "Lavender Butterflies", iconEmoji: "🦋", color: "#9986b8" },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFormatChange = (newFormat: "TEAM_VS_TEAM" | "DUOS" | "SOLOS") => {
    setFormat(newFormat);
    if (newFormat === "TEAM_VS_TEAM") {
      setTeams([
        { name: "Honey Bees", iconEmoji: "🐝", color: "#ebb06e" },
        { name: "Lavender Butterflies", iconEmoji: "🦋", color: "#9986b8" },
      ]);
    } else if (newFormat === "DUOS") {
      setTeams([
        { name: "Caffeine & Code", iconEmoji: "☕", color: "#d9822b" },
        { name: "Midnight Chai", iconEmoji: "🍵", color: "#4b8b67" },
      ]);
    } else if (newFormat === "SOLOS") {
      setTeams([
        { name: "Solo Arena 1", iconEmoji: "🎯", color: "#ebb06e" },
        { name: "Solo Arena 2", iconEmoji: "🚀", color: "#9986b8" },
      ]);
    }
  };

  const handleAddTeam = () => {
    const defaultEmoji = format === "DUOS" ? "🤝" : format === "SOLOS" ? "🎯" : "🛡️";
    setTeams((prev) => [
      ...prev,
      {
        name: `House ${prev.length + 1}`,
        iconEmoji: defaultEmoji,
        color: "#d9822b",
      },
    ]);
  };

  const handleRemoveTeam = (index: number) => {
    if (teams.length <= 1) return;
    setTeams((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTeamChange = (index: number, field: keyof TeamField, value: string) => {
    setTeams((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await createChallengeAction({
        title,
        format,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        punishmentPfpUrl: punishmentPfpUrl.trim() || undefined,
        teams: teams.map((t, idx) => ({
          name: t.name.trim(),
          iconEmoji: t.iconEmoji.trim() || "🛡️",
          color: t.color.trim() || null,
          sortOrder: idx,
        })),
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
        return;
      }

      router.push(`/admin/challenges/${result.challengeId}`);
    } catch {
      setErrorMessage("An unexpected error occurred while creating the challenge.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMessage && (
        <div className="rounded-2xl border border-cafe-terracotta/40 bg-cafe-terracotta-surface p-4 text-sm text-cafe-parchment">
          {errorMessage}
        </div>
      )}

      {/* Step 1: Challenge Format */}
      <div className="rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe space-y-4">
        <h2 className="font-serif text-lg font-semibold text-cafe-parchment">
          1. Select Battle Format (FEAT-CHAL-01)
        </h2>
        <p className="text-xs text-cafe-oatmeal">
          Law L1 Single Entity Unity: All modes calculate scores through unified teams (Solo = 1, Duo = 2).
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => handleFormatChange("TEAM_VS_TEAM")}
            className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-colors min-h-[44px] ${
              format === "TEAM_VS_TEAM"
                ? "border-cafe-honey bg-cafe-elevated text-cafe-parchment"
                : "border-cafe-border bg-cafe-wood/50 text-cafe-oatmeal hover:bg-cafe-wood"
            }`}
          >
            <span className="text-xl">🐝 vs 🦋</span>
            <strong className="mt-2 text-sm font-semibold text-cafe-parchment">
              Team vs Team (Houses)
            </strong>
            <span className="text-xs text-cafe-oatmeal">
              Two competing houses with uncapped rosters.
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFormatChange("DUOS")}
            className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-colors min-h-[44px] ${
              format === "DUOS"
                ? "border-cafe-honey bg-cafe-elevated text-cafe-parchment"
                : "border-cafe-border bg-cafe-wood/50 text-cafe-oatmeal hover:bg-cafe-wood"
            }`}
          >
            <span className="text-xl">🤝</span>
            <strong className="mt-2 text-sm font-semibold text-cafe-parchment">
              Duos (N=2 Pairs)
            </strong>
            <span className="text-xs text-cafe-oatmeal">
              Accountability partners with self-naming rights.
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFormatChange("SOLOS")}
            className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-colors min-h-[44px] ${
              format === "SOLOS"
                ? "border-cafe-honey bg-cafe-elevated text-cafe-parchment"
                : "border-cafe-border bg-cafe-wood/50 text-cafe-oatmeal hover:bg-cafe-wood"
            }`}
          >
            <span className="text-xl">🎯</span>
            <strong className="mt-2 text-sm font-semibold text-cafe-parchment">
              Solos (Free-For-All)
            </strong>
            <span className="text-xs text-cafe-oatmeal">
              Individual participants competing directly.
            </span>
          </button>
        </div>
      </div>

      {/* Step 2: Challenge Details */}
      <div className="rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe space-y-4">
        <h2 className="font-serif text-lg font-semibold text-cafe-parchment">
          2. Challenge Schedule & Assets
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-cafe-linen mb-1">
              Challenge Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-cafe-border bg-cafe-wood px-4 py-2.5 text-sm text-cafe-parchment focus:border-cafe-honey focus:outline-none"
              placeholder="e.g. Battle of the Houses Season 1"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-cafe-linen mb-1">
              Kickoff Date & Time (UTC) *
            </label>
            <input
              type="datetime-local"
              required
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full rounded-xl border border-cafe-border bg-cafe-wood px-4 py-2.5 text-sm font-mono text-cafe-parchment focus:border-cafe-honey focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-cafe-linen mb-1">
              Conclusion Date & Time (UTC) *
            </label>
            <input
              type="datetime-local"
              required
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full rounded-xl border border-cafe-border bg-cafe-wood px-4 py-2.5 text-sm font-mono text-cafe-parchment focus:border-cafe-honey focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-cafe-linen mb-1">
              Punishment PFP Asset URL (Optional)
            </label>
            <input
              type="url"
              value={punishmentPfpUrl}
              onChange={(e) => setPunishmentPfpUrl(e.target.value)}
              className="w-full rounded-xl border border-cafe-border bg-cafe-wood px-4 py-2.5 text-sm text-cafe-parchment focus:border-cafe-honey focus:outline-none"
              placeholder="https://cdn.example.com/pfp/clown-bee.jpg"
            />
            <p className="mt-1 text-xs text-cafe-oatmeal">
              Enables the 1-click &quot;Download Event Avatar&quot; button on the Punishment Wall upon challenge conclusion.
            </p>
          </div>
        </div>
      </div>

      {/* Step 3: Dynamic Teams Configuration */}
      <div className="rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-semibold text-cafe-parchment">
              3. Dynamic House & Team Identities
            </h2>
            <p className="text-xs text-cafe-oatmeal">
              Configure per-challenge thematic names, mascots, and accent colors.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleAddTeam}
            className="min-h-[44px] text-xs"
          >
            <Plus className="size-3.5" />
            <span>Add Team</span>
          </Button>
        </div>

        <div className="space-y-3">
          {teams.map((team, idx) => (
            <div
              key={idx}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-cafe-border bg-cafe-wood p-3.5"
            >
              <div className="w-14">
                <input
                  type="text"
                  maxLength={4}
                  value={team.iconEmoji}
                  onChange={(e) => handleTeamChange(idx, "iconEmoji", e.target.value)}
                  className="w-full rounded-lg border border-cafe-border bg-cafe-card px-2 py-2 text-center text-lg"
                  title="Emoji Mascot"
                />
              </div>

              <div className="flex-1 min-w-[160px]">
                <input
                  type="text"
                  required
                  value={team.name}
                  onChange={(e) => handleTeamChange(idx, "name", e.target.value)}
                  className="w-full rounded-lg border border-cafe-border bg-cafe-card px-3 py-2 text-sm text-cafe-parchment focus:border-cafe-honey focus:outline-none"
                  placeholder="Team Name"
                />
              </div>

              <div className="w-24">
                <input
                  type="color"
                  value={team.color}
                  onChange={(e) => handleTeamChange(idx, "color", e.target.value)}
                  className="h-9 w-full rounded-lg border border-cafe-border bg-cafe-card cursor-pointer"
                  title="Accent Color"
                />
              </div>

              {teams.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTeam(idx)}
                  className="flex size-9 items-center justify-center rounded-lg border border-cafe-border bg-cafe-card text-cafe-terracotta hover:bg-cafe-elevated"
                  title="Remove Team"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-h-[44px] px-8 text-sm"
        >
          {isSubmitting ? (
            <span>Creating Challenge...</span>
          ) : (
            <>
              <span>Save &amp; Configure Roster</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

