import {
  formatSecondsToClock,
  formatSecondsToHuman,
} from "@/features/study-logs/domain/duration";

export interface DiscordSummaryParticipant {
  id: string;
  displayName: string;
  username: string;
  teamName: string;
  totalLoggedSeconds: number;
  targetSeconds: number;
  progressPercent: number;
  rank: number;
  completedGoalsCount: number;
  totalGoalsCount: number;
  punishmentEvaluation: {
    isPunished: boolean;
    hoursDeficitSeconds: number;
    incompleteGoals: number;
  };
  punishmentRecord?: {
    isPardoned: boolean;
    pardonReason?: string | null;
  } | null;
}

export interface DiscordSummaryTeam {
  id: string;
  name: string;
  iconEmoji?: string | null;
  totalSeconds: number;
  memberCount: number;
}

export interface DiscordSummaryLeadMargin {
  marginSeconds: number;
  leader: "a" | "b" | "tie";
  leadingTeam?: { name: string } | null;
  isTie: boolean;
}

export interface DiscordSummaryInput {
  challenge: {
    id: string;
    title: string;
    format: string;
    status: "UPCOMING" | "ACTIVE" | "COMPLETED";
    startAt: Date;
    endAt: Date;
    punishmentPfpUrl?: string | null;
  };
  teams: DiscordSummaryTeam[];
  leadMargin?: DiscordSummaryLeadMargin | null;
  participants: DiscordSummaryParticipant[];
}

/**
 * Pure domain Markdown generator for 1-click Discord summary copy (FEAT-DISC-01).
 * Zero React/ORM dependencies; produces clean Discord-compatible Markdown.
 */
export function generateDiscordSummary(input: DiscordSummaryInput): string {
  const { challenge, teams, leadMargin, participants } = input;

  if (challenge.status === "UPCOMING") {
    return generateUpcomingSummary(challenge, teams, participants);
  }

  if (challenge.status === "ACTIVE") {
    return generateActiveSummary(challenge, teams, leadMargin, participants);
  }

  return generateCompletedSummary(challenge, teams, leadMargin, participants);
}

function generateUpcomingSummary(
  challenge: DiscordSummaryInput["challenge"],
  teams: DiscordSummaryTeam[],
  participants: DiscordSummaryParticipant[],
): string {
  const lines: string[] = [
    `# 📅 Upcoming Challenge: ${challenge.title}`,
    `**Format:** ${formatChallengeFormat(challenge.format)}`,
    `**Kickoff Date:** ${formatDate(challenge.startAt)}`,
    `**Concludes:** ${formatDate(challenge.endAt)}`,
    "",
    "### 🛡️ Teams & Rosters:",
  ];

  for (const team of teams) {
    const teamEmoji = team.iconEmoji ? `${team.iconEmoji} ` : "";
    const teamMembers = participants.filter((p) => p.teamName === team.name);

    lines.push(`**${teamEmoji}${team.name}** (${team.memberCount} members):`);
    if (teamMembers.length > 0) {
      lines.push(
        teamMembers
          .map((m) => `  - ${m.displayName} (@${m.username})`)
          .join("\n"),
      );
    } else {
      lines.push("  - *No members enrolled yet.*");
    }
  }

  lines.push("");
  lines.push("Declared weekly study hours and goals will lock upon kickoff!");
  return lines.join("\n");
}

function generateActiveSummary(
  challenge: DiscordSummaryInput["challenge"],
  teams: DiscordSummaryTeam[],
  leadMargin: DiscordSummaryLeadMargin | null | undefined,
  participants: DiscordSummaryParticipant[],
): string {
  const lines: string[] = [
    `# ⚡ Live Match Standings: ${challenge.title}`,
    "",
  ];

  if (teams.length === 2) {
    const [teamA, teamB] = teams;
    const aEmoji = teamA.iconEmoji ? `${teamA.iconEmoji} ` : "";
    const bEmoji = teamB.iconEmoji ? `${teamB.iconEmoji} ` : "";

    lines.push(`**${aEmoji}${teamA.name}**`);
    lines.push(`\`${formatSecondsToClock(teamA.totalSeconds)}\``);
    lines.push("");
    lines.push("vs");
    lines.push("");
    lines.push(`**${bEmoji}${teamB.name}**`);
    lines.push(`\`${formatSecondsToClock(teamB.totalSeconds)}\``);
    lines.push("");

    if (leadMargin?.isTie) {
      lines.push("**Lead:** Tied Match (All Square)");
    } else if (leadMargin?.leadingTeam) {
      lines.push(
        `**Lead:** ${leadMargin.leadingTeam.name} ahead by \`${formatSecondsToHuman(leadMargin.marginSeconds)}\``,
      );
    }
  } else {
    lines.push("### 📊 Current House Totals:");
    for (const team of teams) {
      const emoji = team.iconEmoji ? `${team.iconEmoji} ` : "";
      lines.push(
        `- **${emoji}${team.name}**: \`${formatSecondsToClock(team.totalSeconds)}\``,
      );
    }
  }

  lines.push("");
  lines.push("### 🏆 Individual Podium:");
  const sorted = [...participants].sort((a, b) => a.rank - b.rank);
  const topThree = sorted.slice(0, 3);

  if (topThree.length > 0) {
    topThree.forEach((p) => {
      const medal = p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : "🥉";
      lines.push(
        `${medal} **${p.displayName}** — \`${formatSecondsToClock(p.totalLoggedSeconds)}\` (${p.teamName})`,
      );
    });
  } else {
    lines.push("*No participant logs recorded yet.*");
  }

  lines.push("");
  lines.push("*Keep the gentle momentum going! Deficits roll forward daily.*");
  return lines.join("\n");
}

function generateCompletedSummary(
  challenge: DiscordSummaryInput["challenge"],
  teams: DiscordSummaryTeam[],
  leadMargin: DiscordSummaryLeadMargin | null | undefined,
  participants: DiscordSummaryParticipant[],
): string {
  const lines: string[] = [
    `# 🏆 Final Challenge Results: ${challenge.title}`,
    "",
  ];

  if (leadMargin?.isTie) {
    lines.push("🤝 **Result:** Tied Event (All Square)");
  } else if (leadMargin?.leadingTeam) {
    lines.push(
      `🎉 **Winning House:** ${leadMargin.leadingTeam.name} (+${formatSecondsToHuman(leadMargin.marginSeconds)} margin)`,
    );
  }

  lines.push("");
  lines.push("### 📊 Final House Totals:");
  for (const team of teams) {
    const emoji = team.iconEmoji ? `${team.iconEmoji} ` : "";
    lines.push(
      `- **${emoji}${team.name}**: \`${formatSecondsToClock(team.totalSeconds)}\` (${team.memberCount} members)`,
    );
  }

  lines.push("");
  lines.push("### 🥇 Final Individual Podium:");
  const sorted = [...participants].sort((a, b) => a.rank - b.rank);
  const topThree = sorted.slice(0, 3);
  if (topThree.length > 0) {
    topThree.forEach((p) => {
      const medal = p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : "🥉";
      lines.push(
        `${medal} **${p.displayName}** (@${p.username}) — \`${formatSecondsToClock(p.totalLoggedSeconds)}\` (${p.teamName})`,
      );
    });
  }

  // Dual-failure forfeit roster
  const forfeits = participants.filter((p) => {
    const isPardoned = p.punishmentRecord?.isPardoned ?? false;
    return p.punishmentEvaluation.isPunished && !isPardoned;
  });

  lines.push("");
  lines.push("### ⚠️ The Accountability Nook (Forfeits):");
  if (forfeits.length > 0) {
    for (const f of forfeits) {
      const details: string[] = [];
      if (f.punishmentEvaluation.hoursDeficitSeconds > 0) {
        details.push(
          `-${formatSecondsToHuman(f.punishmentEvaluation.hoursDeficitSeconds)} hours`,
        );
      }
      if (f.punishmentEvaluation.incompleteGoals > 0) {
        details.push(
          `${f.punishmentEvaluation.incompleteGoals} unfinished goal${f.punishmentEvaluation.incompleteGoals === 1 ? "" : "s"}`,
        );
      }
      lines.push(
        `- 🚨 **${f.displayName}** (@${f.username}) — ${details.join(", ")}`,
      );
    }
  } else {
    lines.push(
      "🌿 *All targets met! Every participant completed their intentions. Zero forfeits this round.*",
    );
  }

  // Pardons
  const pardons = participants.filter(
    (p) => p.punishmentRecord?.isPardoned === true,
  );
  if (pardons.length > 0) {
    lines.push("");
    lines.push("### 🕊️ Granted Pardons:");
    for (const p of pardons) {
      const reason = p.punishmentRecord?.pardonReason
        ? ` (${p.punishmentRecord.pardonReason})`
        : "";
      lines.push(`- 🕊️ **${p.displayName}** (@${p.username})${reason}`);
    }
  }

  return lines.join("\n");
}

function formatChallengeFormat(format: string): string {
  switch (format) {
    case "TEAM_VS_TEAM":
      return "Team vs Team (Houses)";
    case "DUOS":
      return "Duos (Pairs)";
    case "SOLOS":
      return "Solos (Individual Battle)";
    default:
      return format;
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

