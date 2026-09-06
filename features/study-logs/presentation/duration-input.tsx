"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { composeDurationSeconds } from "@/features/study-logs/domain/daily-log.validation";
import { formatSecondsToClock } from "@/features/study-logs/domain/duration";

interface DurationInputProps {
  hours: number;
  minutes: number;
  seconds: number;
  onChange: (values: { hours: number; minutes: number; seconds: number }) => void;
  disabled?: boolean;
  idPrefix?: string;
}

export function DurationInput({
  hours,
  minutes,
  seconds,
  onChange,
  disabled = false,
  idPrefix = "duration",
}: DurationInputProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <DurationField
        id={`${idPrefix}-hours`}
        label="Hours"
        value={hours}
        max={24}
        disabled={disabled}
        onChange={(value) => onChange({ hours: value, minutes, seconds })}
      />
      <span className="font-mono text-lg text-cafe-ash">:</span>
      <DurationField
        id={`${idPrefix}-minutes`}
        label="Minutes"
        value={minutes}
        max={59}
        disabled={disabled}
        onChange={(value) => onChange({ hours, minutes: value, seconds })}
      />
      <span className="font-mono text-lg text-cafe-ash">:</span>
      <DurationField
        id={`${idPrefix}-seconds`}
        label="Seconds"
        value={seconds}
        max={59}
        disabled={disabled}
        onChange={(value) => onChange({ hours, minutes, seconds: value })}
      />
    </div>
  );
}

interface DurationFieldProps {
  id: string;
  label: string;
  value: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

function DurationField({
  id,
  label,
  value,
  max,
  disabled,
  onChange,
}: DurationFieldProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <label htmlFor={id} className="sr-only">{label}</label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);
          onChange(Number.isNaN(next) ? 0 : Math.min(max, Math.max(0, next)));
        }}
        className="h-12 w-16 text-center font-mono text-lg font-mono-tabular bg-cafe-wood"
        aria-label={label}
      />
    </div>
  );
}

const QUICK_ADD_OPTIONS = [
  { label: "+15m", seconds: 15 * 60 },
  { label: "+30m", seconds: 30 * 60 },
  { label: "+1h", seconds: 60 * 60 },
  { label: "+2h", seconds: 2 * 60 * 60 },
] as const;

interface QuickAddChipsProps {
  hours: number;
  minutes: number;
  seconds: number;
  onChange: (values: { hours: number; minutes: number; seconds: number }) => void;
  disabled?: boolean;
  maxDailySeconds: number;
}

export function QuickAddChips({
  hours,
  minutes,
  seconds,
  onChange,
  disabled = false,
  maxDailySeconds,
}: QuickAddChipsProps) {
  const currentTotal = composeDurationSeconds(hours, minutes, seconds);

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {QUICK_ADD_OPTIONS.map((option) => (
        <button
          key={option.label}
          type="button"
          disabled={disabled || currentTotal + option.seconds > maxDailySeconds}
          onClick={() => {
            const nextTotal = Math.min(
              maxDailySeconds,
              currentTotal + option.seconds,
            );
            onChange(splitDuration(nextTotal));
          }}
          className={cn(
            "min-h-[44px] rounded-full border border-cafe-border px-4 py-2 text-xs font-medium text-cafe-linen transition-colors hover:border-cafe-honey/50 hover:bg-cafe-elevated disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function splitDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

export function useDurationState(initialSeconds = 0) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const split = splitDuration(initialSeconds);
    setHours(split.hours);
    setMinutes(split.minutes);
    setSeconds(split.seconds);
  }, [initialSeconds]);

  const setAll = (values: { hours: number; minutes: number; seconds: number }) => {
    setHours(values.hours);
    setMinutes(values.minutes);
    setSeconds(values.seconds);
  };

  const totalSeconds = composeDurationSeconds(hours, minutes, seconds);
  const clock = formatSecondsToClock(totalSeconds);

  return { hours, minutes, seconds, setAll, totalSeconds, clock };
}
