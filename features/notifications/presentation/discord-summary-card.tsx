"use client";

import { useState } from "react";
import { Check, Copy, MessageSquareShare } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  generateDiscordSummary,
  type DiscordSummaryInput,
} from "@/features/notifications/domain/discord-summary";

interface DiscordSummaryCardProps {
  data: DiscordSummaryInput;
}

export function DiscordSummaryCard({ data }: DiscordSummaryCardProps) {
  const [copied, setCopied] = useState(false);
  const summaryMarkdown = generateDiscordSummary(data);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for environments where navigator.clipboard is restricted
      const textarea = document.createElement("textarea");
      textarea.value = summaryMarkdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="rounded-2xl border border-cafe-border bg-cafe-card p-5 md:p-6 shadow-cafe">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-honey/15 text-cafe-honey">
              <MessageSquareShare className="h-4 w-4" />
            </span>
            <h3 className="font-serif text-lg font-semibold text-cafe-parchment">
              1-Click Discord Broadcaster
            </h3>
          </div>
          <p className="mt-1 text-xs text-cafe-oatmeal">
            Export ready-to-paste markdown summary for Discord announcements (#study-battles).
          </p>
        </div>

        <Button
          onClick={handleCopy}
          className="h-11 min-h-[44px] gap-2 font-medium"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-cafe-bg" />
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy Discord Summary</span>
            </>
          )}
        </Button>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium text-cafe-ash uppercase tracking-wider mb-2">
          Markdown Preview
        </label>
        <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-xl border border-cafe-border/80 bg-cafe-bg/90 p-4 font-mono text-xs text-cafe-linen shadow-inner selection:bg-cafe-honey selection:text-cafe-bg">
          {summaryMarkdown}
        </pre>
      </div>
    </div>
  );
}
