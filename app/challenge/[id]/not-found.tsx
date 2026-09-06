import Link from "next/link";
import { Coffee, ArrowLeft } from "lucide-react";

export default function ChallengeNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-3xl border border-cafe-border bg-cafe-card text-cafe-honey shadow-cafe">
        <Coffee className="size-7" />
      </div>

      <h1 className="mt-6 font-serif text-2xl font-bold text-cafe-parchment sm:text-3xl">
        Challenge Not Found
      </h1>

      <p className="mt-2 max-w-md text-sm leading-relaxed text-cafe-oatmeal">
        This study challenge doesn’t exist or may have been archived by the community host. Check the link or explore current events.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-cafe-border bg-cafe-card px-5 py-2.5 text-sm font-medium text-cafe-parchment hover:bg-cafe-wood transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}

