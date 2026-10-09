import type { ParticipantStatsViewModel } from "../domain/participant-stats.types";
import { ParticipantProfileHeader } from "./participant-profile-header";
import { ParticipantSummaryCards } from "./participant-summary-cards";
import { ParticipantProgressChart } from "./participant-progress-chart";
import { ParticipantDailyHistory } from "./participant-daily-history";
import { ParticipantTeamStats } from "./participant-team-stats";
import { ParticipantAccountability } from "./participant-accountability";

interface ParticipantStatsViewProps {
   stats: ParticipantStatsViewModel;
}

export function ParticipantStatsView({ stats }: ParticipantStatsViewProps) {
   const { profile, summary, dailyHistory, teamStats, accountability, viewer } =
      stats;

   return (
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
         {/* 1. Profile Header with Breadcrumbs */}
         <ParticipantProfileHeader profile={profile} isAdmin={viewer.isAdmin} />

         {/* 2. Key Metrics Summary Cards */}
         <ParticipantSummaryCards summary={summary} />

         {/* 3. Progress Visualization Chart */}
         <ParticipantProgressChart dailyHistory={dailyHistory} />

         {/* 4. Team Standing & Share (if team-based challenge) */}
         {teamStats && <ParticipantTeamStats teamStats={teamStats} />}

         {/* 5. Accountability & Deficit Status */}
         <ParticipantAccountability accountability={accountability} />

         {/* 6. Complete Chronological Daily Study History */}
         <ParticipantDailyHistory dailyHistory={dailyHistory} />
      </div>
   );
}
