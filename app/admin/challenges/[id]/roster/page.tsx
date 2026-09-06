import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAdminChallengeData } from "@/features/challenges/data/admin-challenge-view";
import { AdminChallengeConsole } from "@/features/challenges/presentation/admin-challenge-console";

interface AdminChallengeRosterPageProps {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

export default async function AdminChallengeRosterPage({
  params,
}: AdminChallengeRosterPageProps) {
  const challengeData = await getAdminChallengeData(params.id);

  if (!challengeData) {
    return (
      <div className="rounded-2xl border border-cafe-border bg-cafe-card p-12 text-center shadow-cafe max-w-lg mx-auto mt-12">
        <ShieldAlert className="mx-auto h-12 w-12 text-cafe-terracotta" />
        <h2 className="mt-4 font-serif text-xl font-semibold text-cafe-parchment">
          Challenge Not Found
        </h2>
        <div className="mt-6">
          <Link href="/admin">
            <Button variant="secondary" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Tournaments</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-cafe-oatmeal">
        <Link href="/admin" className="hover:text-cafe-honey transition-colors">
          Tournaments
        </Link>
        <span>/</span>
        <Link
          href={`/admin/challenges/${challengeData.id}`}
          className="hover:text-cafe-honey transition-colors truncate max-w-[200px]"
        >
          {challengeData.title}
        </Link>
        <span>/</span>
        <span className="text-cafe-linen">Roster & Overrides</span>
      </div>

      <AdminChallengeConsole initialData={challengeData} defaultTab="roster" />
    </div>
  );
}
