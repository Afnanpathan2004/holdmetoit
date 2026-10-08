import { auth } from "@/core/auth";
import { AppHeader } from "@/features/auth/presentation/auth-nav";

export default async function ChallengeLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   const session = await auth();

   return (
      <div className="min-h-screen bg-[#0d0d0d] text-[#f4f3f6]">
         <AppHeader user={session?.user} />

         {/* Main Page Canvas */}
         <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
         </main>
      </div>
   );
}
