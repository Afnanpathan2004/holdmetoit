"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Crown,
  Flame,
  Palette,
  Sparkles,
  Trophy,
  Users2,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createChallengeAction } from "@/features/challenges/api/challenge-admin.actions";

type Format = "TEAM_VS_TEAM" | "DUOS" | "SOLOS";

interface TeamConfig {
  name: string;
  color: string;
  iconEmoji: string;
  mascotUrl?: string;
}

const PRESET_THEMES: Record<string, { label: string; teams: TeamConfig[] }> = {
  beesVsButterflies: {
    label: "Honey Bees 🐝 vs Lavender Butterflies 🦋",
    teams: [
      {
        name: "Honey Bees",
        color: "#d9822b",
        iconEmoji: "🐝",
        mascotUrl: "/prototype/assets/mascot_bees.jpg",
      },
      {
        name: "Lavender Butterflies",
        color: "#9986b8",
        iconEmoji: "🦋",
        mascotUrl: "/prototype/assets/mascot_butterflies.jpg",
      },
    ],
  },
  owlsVsLarks: {
    label: "Night Owls 🦉 vs Morning Larks 🌅",
    teams: [
      {
        name: "Night Owls",
        color: "#7e57c2",
        iconEmoji: "🦉",
      },
      {
        name: "Morning Larks",
        color: "#ffa726",
        iconEmoji: "🌅",
      },
    ],
  },
  matchaVsEspresso: {
    label: "Matcha Leaves 🍵 vs Roasted Espresso ☕",
    teams: [
      {
        name: "Matcha Leaves",
        color: "#529e72",
        iconEmoji: "🍵",
      },
      {
        name: "Roasted Espresso",
        color: "#c87948",
        iconEmoji: "☕",
      },
    ],
  },
};

export function ChallengeCreatorWizard() {
  const router = useRouter();
  const [format, setFormat] = useState<Format>("TEAM_VS_TEAM");
  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [endAt, setEndAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  const [selectedPreset, setSelectedPreset] = useState<string>("beesVsButterflies");
  const [teams, setTeams] = useState<TeamConfig[]>(
    PRESET_THEMES.beesVsButterflies.teams,
  );
  const [punishmentPfpUrl, setPunishmentPfpUrl] = useState(
    "/prototype/assets/punishment_pfp.jpg",
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (presetKey in PRESET_THEMES) {
      setTeams(PRESET_THEMES[presetKey].teams);
    }
  };

  const handleFormatChange = (newFormat: Format) => {
    setFormat(newFormat);
    if (newFormat === "SOLOS") {
      setTeams([
        {
          name: "Solo Grinders",
          color: "#d9822b",
          iconEmoji: "⚡",
        },
      ]);
    } else if (newFormat === "DUOS") {
      setTeams([
        {
          name: "Duo Pair A",
          color: "#d9822b",
          iconEmoji: "☕",
        },
        {
          name: "Duo Pair B",
          color: "#9986b8",
          iconEmoji: "🌙",
        },
      ]);
    } else {
      setTeams(PRESET_THEMES.beesVsButterflies.teams);
    }
  };

  const updateTeam = (index: number, field: keyof TeamConfig, value: string) => {
    setTeams((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addTeam = () => {
    setTeams((prev) => [
      ...prev,
      {
        name: `Team ${prev.length + 1}`,
        color: "#d9822b",
        iconEmoji: "⭐",
      },
    ]);
  };

  const removeTeam = (index: number) => {
    if (teams.length <= (format === "TEAM_VS_TEAM" ? 2 : 1)) return;
    setTeams((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const result = await createChallengeAction({
        title,
        format,
        startAt,
        endAt,
        punishmentPfpUrl: punishmentPfpUrl || null,
        teams,
      });

      if (result.ok && result.data?.challengeId) {
        router.push(`/admin/challenges/${result.data.challengeId}`);
      } else if (!result.ok) {
        setErrorMsg(result.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Format Selection Card */}
      <div className="rounded-2xl border border-cafe-border bg-cafe-card p-5 md:p-6 shadow-cafe">
        <div className="flex items-center gap-2 pb-3 border-b border-cafe-border">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-honey/15 text-cafe-honey">
            <Trophy className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-serif text-base font-semibold text-cafe-parchment">
              Step 1: Choose Battle Format
            </h3>
            <p className="text-xs text-cafe-oatmeal">
              HoldMeToIt mathematically unifies Solos, Duos, and Team battles (Law L1).
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleFormatChange("TEAM_VS_TEAM")}
            className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
              format === "TEAM_VS_TEAM"
                ? "border-cafe-honey bg-cafe-honey/10 ring-1 ring-cafe-honey"
                : "border-cafe-border bg-cafe-bg/60 hover:border-cafe-borderLight"
            }`}
          >
            <Users2 className="h-5 w-5 text-cafe-honey mb-2" />
            <span className="font-serif font-semibold text-sm text-cafe-parchment">
              Team vs Team
            </span>
            <span className="text-xs text-cafe-oatmeal mt-1">
              Two competing named houses with cumulative scores.
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFormatChange("DUOS")}
            className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
              format === "DUOS"
                ? "border-cafe-honey bg-cafe-honey/10 ring-1 ring-cafe-honey"
                : "border-cafe-border bg-cafe-bg/60 hover:border-cafe-borderLight"
            }`}
          >
            <Sparkles className="h-5 w-5 text-cafe-honey mb-2" />
            <span className="font-serif font-semibold text-sm text-cafe-parchment">
              Duos Battle
            </span>
            <span className="text-xs text-cafe-oatmeal mt-1">
              Pairs of N=2 accountability partners with self-naming (FEAT-CHAL-06).
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFormatChange("SOLOS")}
            className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
              format === "SOLOS"
                ? "border-cafe-honey bg-cafe-honey/10 ring-1 ring-cafe-honey"
                : "border-cafe-border bg-cafe-bg/60 hover:border-cafe-borderLight"
            }`}
          >
            <User className="h-5 w-5 text-cafe-honey mb-2" />
            <span className="font-serif font-semibold text-sm text-cafe-parchment">
              Solos FFA
            </span>
            <span className="text-xs text-cafe-oatmeal mt-1">
              Free-for-all individual leaderboard (maxMembers = 1).
            </span>
          </button>
        </div>
      </div>

      {/* Challenge Information Card */}
      <div className="rounded-2xl border border-cafe-border bg-cafe-card p-5 md:p-6 shadow-cafe">
        <div className="flex items-center gap-2 pb-3 border-b border-cafe-border">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-honey/15 text-cafe-honey">
            <Calendar className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-serif text-base font-semibold text-cafe-parchment">
              Step 2: Challenge Details & Timetable
            </h3>
            <p className="text-xs text-cafe-oatmeal">
              Set competition dates and event name.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-cafe-linen mb-1">
              Challenge Title *
            </label>
            <Input
              type="text"
              placeholder="e.g. Midterm Reading Week Sprint"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              maxLength={80}
              className="bg-cafe-bg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-cafe-linen mb-1">
                Start Date & Time (UTC) *
              </label>
              <Input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
                className="bg-cafe-bg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cafe-linen mb-1">
                End Date & Time (UTC) *
              </label>
              <Input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                required
                className="bg-cafe-bg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Team Identities Card */}
      <div className="rounded-2xl border border-cafe-border bg-cafe-card p-5 md:p-6 shadow-cafe">
        <div className="flex items-center gap-2 pb-3 border-b border-cafe-border">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-honey/15 text-cafe-honey">
            <Palette className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-serif text-base font-semibold text-cafe-parchment">
              Step 3: Dynamic House / Team Identities
            </h3>
            <p className="text-xs text-cafe-oatmeal">
              Dynamic per-event thematic team names, colors, and mascot icons (FEAT-CHAL-06).
            </p>
          </div>
        </div>

        {format === "TEAM_VS_TEAM" && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-cafe-ash uppercase tracking-wider mb-2">
              Thematic Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRESET_THEMES).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePresetChange(key)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors ${
                    selectedPreset === key
                      ? "border-cafe-honey bg-cafe-honey/15 text-cafe-honey"
                      : "border-cafe-border bg-cafe-bg/60 text-cafe-linen hover:bg-cafe-wood"
                  }`}
                >
                  {val.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedPreset("custom")}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors ${
                  selectedPreset === "custom"
                    ? "border-cafe-honey bg-cafe-honey/15 text-cafe-honey"
                    : "border-cafe-border bg-cafe-bg/60 text-cafe-linen hover:bg-cafe-wood"
                }`}
              >
                Custom Theme ✍️
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {teams.map((team, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-cafe-border/80 bg-cafe-bg/60"
            >
              <div className="w-14">
                <label className="block text-[10px] text-cafe-ash mb-1">Emoji</label>
                <Input
                  type="text"
                  maxLength={4}
                  value={team.iconEmoji || ""}
                  onChange={(e) => updateTeam(idx, "iconEmoji", e.target.value)}
                  className="text-center font-mono bg-cafe-bg"
                />
              </div>

              <div className="flex-1">
                <label className="block text-[10px] text-cafe-ash mb-1">Team Name</label>
                <Input
                  type="text"
                  value={team.name}
                  onChange={(e) => updateTeam(idx, "name", e.target.value)}
                  required
                  className="bg-cafe-bg"
                />
              </div>

              <div className="w-24">
                <label className="block text-[10px] text-cafe-ash mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={team.color || "#d9822b"}
                    onChange={(e) => updateTeam(idx, "color", e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-lg border border-cafe-border bg-transparent p-0.5"
                  />
                  <span className="font-mono text-[10px] text-cafe-ash">
                    {team.color}
                  </span>
                </div>
              </div>

              {format === "TEAM_VS_TEAM" && teams.length > 2 && (
                <div className="self-end sm:self-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTeam(idx)}
                    className="text-cafe-terracotta hover:bg-cafe-terracotta/10 text-xs"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          ))}

          {format === "TEAM_VS_TEAM" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTeam}
              className="text-xs gap-1 border-dashed text-cafe-honey"
            >
              + Add Another Team
            </Button>
          )}
        </div>
      </div>

      {/* Punishment PFP Asset Card */}
      <div className="rounded-2xl border border-cafe-border bg-cafe-card p-5 md:p-6 shadow-cafe">
        <div className="flex items-center gap-2 pb-3 border-b border-cafe-border">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-honey/15 text-cafe-honey">
            <Flame className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-serif text-base font-semibold text-cafe-parchment">
              Step 4: Assigned Punishment PFP Asset
            </h3>
            <p className="text-xs text-cafe-oatmeal">
              The storybook forfeit avatar members download if they fail hours or goals (Law L6 / FEAT-PUN-03).
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-cafe-border bg-cafe-bg">
            <Image
              src={punishmentPfpUrl || "/prototype/assets/punishment_pfp.jpg"}
              alt="Assigned Forfeit Avatar"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-cafe-linen mb-1">
              Forfeit Avatar Asset URL
            </label>
            <Input
              type="text"
              value={punishmentPfpUrl}
              onChange={(e) => setPunishmentPfpUrl(e.target.value)}
              placeholder="/prototype/assets/punishment_pfp.jpg"
              className="bg-cafe-bg font-mono text-xs"
            />
            <span className="text-[11px] text-cafe-ash mt-1 block">
              Default is the whimsical storybook forfeit avatar (`/prototype/assets/punishment_pfp.jpg`).
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-cafe-terracotta/40 bg-cafe-terracotta/10 p-4 text-xs text-cafe-parchment">
          <AlertCircle className="h-4 w-4 text-cafe-terracotta shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || !title.trim()}
          className="h-11 px-8 gap-2 font-semibold shadow-cafe"
        >
          {isPending ? "Creating Tournament..." : "Create & Launch Challenge 🚀"}
        </Button>
      </div>
    </form>
  );
}
