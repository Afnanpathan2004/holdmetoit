"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { logStudyTimeAction } from "@/features/study-logs/api/log-study-time.action";
import {
  DurationInput,
  QuickAddChips,
  useDurationState,
} from "@/features/study-logs/presentation/duration-input";
import { cn } from "@/lib/utils";
import { MAX_DAILY_LOG_SECONDS } from "@/features/study-logs/domain/duration";

interface StudyDeskLogProps {
  challengeId: string;
  canLog: boolean;
  todayDate: string;
  logs: Array<{ logDate: string; durationClock: string; durationSeconds: number }>;
}

function getWeekDates(anchorDate: string): string[] {
  const anchor = new Date(`${anchorDate}T00:00:00.000Z`);
  const day = anchor.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function StudyDeskLog({
  challengeId,
  canLog,
  todayDate,
  logs,
}: StudyDeskLogProps) {
  const weekDates = getWeekDates(todayDate);
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedLog = logs.find((log) => log.logDate === selectedDate);
  const initialSeconds = selectedLog?.durationSeconds ?? 0;
  const { hours, minutes, seconds, setAll, clock } = useDurationState(initialSeconds);

  const selectedRemainingAllowance =
    MAX_DAILY_LOG_SECONDS - composeDurationFromParts(hours, minutes, seconds);

  const handleSubmit = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await logStudyTimeAction({
        challengeId,
        logDate: selectedDate,
        hours,
        minutes,
        seconds,
      });

      if (result.ok) {
        setFeedback({ type: "success", message: "Study time recorded for this day." });
        setMobileOpen(false);
        return;
      }

      setFeedback({ type: "error", message: result.message });
    });
  };

  const formContent = (
    <div className="space-y-5">
      <DaySelector
        weekDates={weekDates}
        selectedDate={selectedDate}
        logs={logs}
        onSelect={setSelectedDate}
      />

      <div className="rounded-2xl border border-cafe-border bg-cafe-wood p-4">
        <p className="text-center text-xs text-cafe-oatmeal">
          Logged for {selectedDate}
        </p>
        <p className="mt-1 text-center font-mono text-2xl font-mono-tabular text-cafe-honey-light">
          {selectedLog?.durationClock ?? "00:00:00"}
        </p>
        {selectedDate === todayDate && canLog ? (
          <p className="mt-2 text-center text-xs text-cafe-ash">
            Up to {formatAllowance(selectedRemainingAllowance)} remaining today
          </p>
        ) : null}
      </div>

      <DurationInput
        hours={hours}
        minutes={minutes}
        seconds={seconds}
        onChange={setAll}
        disabled={!canLog || isPending}
      />

      <QuickAddChips
        hours={hours}
        minutes={minutes}
        seconds={seconds}
        onChange={setAll}
        disabled={!canLog || isPending}
        maxDailySeconds={MAX_DAILY_LOG_SECONDS}
      />

      <p className="text-center text-xs text-cafe-ash">
        New entry: <span className="font-mono font-mono-tabular">{clock}</span>
      </p>

      {feedback ? (
        <p
          role={feedback.type === "error" ? "alert" : "status"}
          className={cn(
            "rounded-xl px-3 py-2 text-center text-sm",
            feedback.type === "success"
              ? "bg-cafe-sage-surface text-cafe-sage"
              : "bg-cafe-terracotta-surface text-cafe-terracotta",
          )}
        >
          {feedback.message}
        </p>
      ) : null}

      <Button
        type="button"
        className="min-h-[44px] w-full"
        disabled={!canLog || isPending}
        onClick={handleSubmit}
      >
        {isPending ? "Saving…" : "Record Today's Study Time"}
      </Button>

      {!canLog ? (
        <p className="text-center text-xs text-cafe-oatmeal">
          Study logging unlocks once your challenge is active.
        </p>
      ) : null}
    </div>
  );

  return (
    <>
      <section className="hidden rounded-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe md:block">
        <header className="mb-6">
          <h2 className="font-serif text-lg font-semibold text-cafe-parchment">
            Study Desk Log
          </h2>
          <p className="text-xs text-cafe-oatmeal">
            Enter time verified via YPT or your timer
          </p>
        </header>
        {formContent}
      </section>

      <div className="md:hidden">
        <Button
          type="button"
          className="min-h-[44px] w-full"
          onClick={() => setMobileOpen(true)}
        >
          Log Hours
        </Button>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60">
            <button
              type="button"
              className="flex-1"
              aria-label="Close logging drawer"
              onClick={() => setMobileOpen(false)}
            />
            <div className="max-h-[85vh] overflow-y-auto rounded-t-3xl border border-cafe-border bg-cafe-card p-6 shadow-cafe">
              <header className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-base font-semibold text-cafe-parchment">
                    Study Desk Log
                  </h2>
                  <p className="text-[11px] text-cafe-oatmeal">
                    Enter time verified via YPT or your timer
                  </p>
                </div>
                <button
                  type="button"
                  className="min-h-[44px] min-w-[44px] rounded-full text-cafe-linen"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </header>
              {formContent}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

interface DaySelectorProps {
  weekDates: string[];
  selectedDate: string;
  logs: Array<{ logDate: string; durationClock: string }>;
  onSelect: (date: string) => void;
}

function DaySelector({ weekDates, selectedDate, logs, onSelect }: DaySelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {weekDates.map((date, index) => {
        const log = logs.find((entry) => entry.logDate === date);
        const isActive = date === selectedDate;

        return (
          <button
            key={date}
            type="button"
            onClick={() => onSelect(date)}
            className={cn(
              "min-h-[44px] min-w-[52px] shrink-0 rounded-xl border px-2 py-2 text-center transition-colors",
              isActive
                ? "border-cafe-honey/70 bg-cafe-elevated text-cafe-parchment shadow-amber-subtle"
                : "border-cafe-border bg-cafe-wood text-cafe-oatmeal hover:border-cafe-borderLight",
            )}
          >
            <span className="block text-[10px] uppercase tracking-wide">
              {DAY_LABELS[index]}
            </span>
            <span className="mt-0.5 block font-mono text-[10px] font-mono-tabular">
              {log?.durationClock.slice(0, 5) ?? "—"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function formatAllowance(seconds: number): string {
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return `${hours}h ${minutes}m`;
}

function composeDurationFromParts(hours: number, minutes: number, seconds: number) {
  return hours * 3_600 + minutes * 60 + seconds;
}
