/**
 * HoldMeToIt — Pure Domain Math & Aggregation for Manual Weekly Leaderboard
 * Authority: AGENTS.md Law L1 (Mathematical Unity), Law L7 (Pure Domain Isolation)
 * Zero external imports from Next.js, React, Prisma, or UI libraries.
 */

export interface UserRef {
   id: string;
   discordName: string;
   discordId?: string | null;
   userPfp?: string | null;
}

export interface TeamRef {
   id: string;
   name: string;
   challengeId: string;
}

export interface TeamMemberRef {
   teamId: string;
   userId: string;
}

export interface LeaderboardEntryRef {
   id: string;
   challengeId: string;
   userId: string;
   sessionHours: number;
   slotDate: string; // ISO date string YYYY-MM-DD
}

export interface TeamStanding {
   teamId: string;
   teamName: string;
   memberCount: number;
   totalHours: number;
   isLeader: boolean;
   rank: number;
}

export interface IndividualStanding {
   rank: number;
   userId: string;
   discordName: string;
   discordId: string | null;
   userPfp: string | null;
   teamId: string | null;
   teamName: string | null;
   totalHours: number;
   slotHours: Record<string, number>;
}

export interface ManualMatchBanner {
   hasMatchup: boolean;
   teamA: TeamStanding | null;
   teamB: TeamStanding | null;
   leadMarginHours: number;
   leaderTeamId: string | null;
   leaderSide: "a" | "b" | "tie";
   ratioPercentageA: number;
   ratioPercentageB: number;
}

export interface ManualLeaderboardSummary {
   teams: TeamStanding[];
   standings: IndividualStanding[];
   matchBanner: ManualMatchBanner;
   slotDates: string[];
   totalHoursLogged: number;
}

/**
 * Rounds a number to a fixed decimal precision (default 2 decimals)
 */
export function roundToTwoDecimals(val: number): number {
   return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Computes individual participant standings sorted descending by total hours.
 */
export function computeIndividualStandings(
   users: UserRef[],
   teams: TeamRef[],
   teamMembers: TeamMemberRef[],
   entries: LeaderboardEntryRef[]
): IndividualStanding[] {
   // Map user to team
   const userTeamMap = new Map<string, string>();
   for (const tm of teamMembers) {
      userTeamMap.set(tm.userId, tm.teamId);
   }

   const teamNameMap = new Map<string, string>();
   for (const t of teams) {
      teamNameMap.set(t.id, t.name);
   }

   // Aggregate hours and per-slot hours per user
   const userHoursMap = new Map<string, number>();
   const userSlotMap = new Map<string, Record<string, number>>();

   for (const entry of entries) {
      const currentTotal = userHoursMap.get(entry.userId) ?? 0;
      userHoursMap.set(
         entry.userId,
         roundToTwoDecimals(currentTotal + entry.sessionHours)
      );

      const slots = userSlotMap.get(entry.userId) ?? {};
      slots[entry.slotDate] = roundToTwoDecimals(
         (slots[entry.slotDate] ?? 0) + entry.sessionHours
      );
      userSlotMap.set(entry.userId, slots);
   }

   // Map users with or without entries
   const rows: IndividualStanding[] = users.map((u) => {
      const teamId = userTeamMap.get(u.id) ?? null;
      const teamName = teamId ? (teamNameMap.get(teamId) ?? null) : null;
      const totalHours = userHoursMap.get(u.id) ?? 0;
      const slotHours = userSlotMap.get(u.id) ?? {};

      return {
         rank: 0,
         userId: u.id,
         discordName: u.discordName,
         discordId: u.discordId ?? null,
         userPfp: u.userPfp ?? null,
         teamId,
         teamName,
         totalHours,
         slotHours,
      };
   });

   // Sort descending by total hours, then alphabetically by discordName
   rows.sort((a, b) => {
      if (b.totalHours !== a.totalHours) {
         return b.totalHours - a.totalHours;
      }
      return a.discordName.localeCompare(b.discordName);
   });

   // Assign ranks
   return rows.map((row, index) => ({
      ...row,
      rank: index + 1,
   }));
}

/**
 * Computes team totals and standings sorted descending by cumulative team hours.
 */
export function computeTeamStandings(
   teams: TeamRef[],
   teamMembers: TeamMemberRef[],
   entries: LeaderboardEntryRef[]
): TeamStanding[] {
   const memberCounts = new Map<string, number>();
   const userToTeam = new Map<string, string>();

   for (const tm of teamMembers) {
      memberCounts.set(tm.teamId, (memberCounts.get(tm.teamId) ?? 0) + 1);
      userToTeam.set(tm.userId, tm.teamId);
   }

   const teamHoursMap = new Map<string, number>();
   for (const t of teams) {
      teamHoursMap.set(t.id, 0);
   }

   for (const entry of entries) {
      const teamId = userToTeam.get(entry.userId);
      if (teamId && teamHoursMap.has(teamId)) {
         const current = teamHoursMap.get(teamId) ?? 0;
         teamHoursMap.set(
            teamId,
            roundToTwoDecimals(current + entry.sessionHours)
         );
      }
   }

   const standings: TeamStanding[] = teams.map((team) => {
      const totalHours = teamHoursMap.get(team.id) ?? 0;
      return {
         teamId: team.id,
         teamName: team.name,
         memberCount: memberCounts.get(team.id) ?? 0,
         totalHours,
         isLeader: false,
         rank: 0,
      };
   });

   // Sort descending by totalHours
   standings.sort((a, b) => {
      if (b.totalHours !== a.totalHours) {
         return b.totalHours - a.totalHours;
      }
      return a.teamName.localeCompare(b.teamName);
   });

   const highestScore = standings[0]?.totalHours ?? 0;

   return standings.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      isLeader: highestScore > 0 && item.totalHours === highestScore,
   }));
}

/**
 * Computes head-to-head match banner between top two teams.
 */
export function computeMatchBanner(
   teamStandings: TeamStanding[]
): ManualMatchBanner {
   if (teamStandings.length < 2) {
      const teamA = teamStandings[0] ?? null;
      return {
         hasMatchup: false,
         teamA,
         teamB: null,
         leadMarginHours: 0,
         leaderTeamId: teamA?.teamId ?? null,
         leaderSide: "a",
         ratioPercentageA: 100,
         ratioPercentageB: 0,
      };
   }

   const teamA = teamStandings[0]!;
   const teamB = teamStandings[1]!;

   const margin = roundToTwoDecimals(
      Math.abs(teamA.totalHours - teamB.totalHours)
   );
   let leaderSide: "a" | "b" | "tie" = "tie";
   let leaderTeamId: string | null = null;

   if (teamA.totalHours > teamB.totalHours) {
      leaderSide = "a";
      leaderTeamId = teamA.teamId;
   } else if (teamB.totalHours > teamA.totalHours) {
      leaderSide = "b";
      leaderTeamId = teamB.teamId;
   }

   const totalMatchHours = teamA.totalHours + teamB.totalHours;
   let ratioPercentageA = 50;
   let ratioPercentageB = 50;

   if (totalMatchHours > 0) {
      ratioPercentageA =
         Math.round((teamA.totalHours / totalMatchHours) * 1000) / 10;
      ratioPercentageB = Math.round((100 - ratioPercentageA) * 10) / 10;
   }

   return {
      hasMatchup: true,
      teamA,
      teamB,
      leadMarginHours: margin,
      leaderTeamId,
      leaderSide,
      ratioPercentageA,
      ratioPercentageB,
   };
}

/**
 * Aggregates all components into a full leaderboard summary.
 */
export function aggregateManualLeaderboard(
   users: UserRef[],
   teams: TeamRef[],
   teamMembers: TeamMemberRef[],
   entries: LeaderboardEntryRef[]
): ManualLeaderboardSummary {
   const standings = computeIndividualStandings(
      users,
      teams,
      teamMembers,
      entries
   );
   const teamStandings = computeTeamStandings(teams, teamMembers, entries);
   const matchBanner = computeMatchBanner(teamStandings);

   // Collect and sort all distinct slot dates
   const dateSet = new Set<string>();
   for (const entry of entries) {
      dateSet.add(entry.slotDate);
   }
   const slotDates = Array.from(dateSet).sort();

   const totalHoursLogged = roundToTwoDecimals(
      entries.reduce((acc, curr) => acc + curr.sessionHours, 0)
   );

   return {
      teams: teamStandings,
      standings,
      matchBanner,
      slotDates,
      totalHoursLogged,
   };
}
