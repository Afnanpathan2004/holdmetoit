"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logStudyTimeAction } from "@/features/study-logs/api/log-study-time.actions";
import {
  decomposeSecondsToParts,
} from "@/features/study-logs/domain/duration";

export interface DailyHoursModalProps {
  challengeId: string;
  isOpen: boolean;
  onClose: () => void;
  todayDate: string;
  todayDayNumber: number;
  yesterdayDate?: string;
  yesterdayDayNumber?: number;
  isYesterdayMissed?: boolean;
  initialDayNumber?: number;
  todayLoggedSeconds?: number;
  yesterdayLoggedSeconds?: number;
  existingLogs?: Record<string, number>;
  initialHours?: number;
  initialMinutes?: number;
  initialSeconds?: number;
  onSuccess?: () => void;
}

export function DailyHoursModal({
  challengeId,
  isOpen,
  onClose,
  todayDate,
  todayDayNumber,
  yesterdayDate,
  yesterdayDayNumber,
  isYesterdayMissed = false,
  initialDayNumber,
  todayLoggedSeconds = 0,
  yesterdayLoggedSeconds = 0,
  existingLogs,
  initialHours = 0,
  initialMinutes = 0,
  initialSeconds = 0,
  onSuccess,
}: DailyHoursModalProps) {
  const router = useRouter();
  const showYesterdayOption = Boolean(isYesterdayMissed && yesterdayDate);
  const initialDayNumberToUse =
    showYesterdayOption &&
    yesterdayDayNumber !== undefined &&
    initialDayNumber === yesterdayDayNumber
      ? yesterdayDayNumber
      : todayDayNumber;

  const getExistingSecondsForDate = (date: string): number => {
    if (existingLogs && date in existingLogs) {
      return existingLogs[date];
    }
    if (date === todayDate) return todayLoggedSeconds ?? 0;
    if (date === yesterdayDate) return yesterdayLoggedSeconds ?? 0;
    return 0;
  };

  const getInitialInputValues = (date: string) => {
    if (initialHours > 0 || initialMinutes > 0 || initialSeconds > 0) {
      return {
        hours: initialHours > 0 ? String(initialHours) : "",
        minutes: initialMinutes > 0 ? String(initialMinutes) : "",
        seconds: initialSeconds > 0 ? String(initialSeconds) : "",
      };
    }
    const existing = getExistingSecondsForDate(date);
    if (existing > 0) {
      const parts = decomposeSecondsToParts(existing);
      return {
        hours: String(parts.hours),
        minutes: String(parts.minutes),
        seconds: String(parts.seconds),
      };
    }
    return { hours: "", minutes: "", seconds: "" };
  };

  const initialDateToUse =
    initialDayNumberToUse === yesterdayDayNumber && yesterdayDate
      ? yesterdayDate
      : todayDate;
  const initialInputs = getInitialInputValues(initialDateToUse);
  const [selectedDayNumber, setSelectedDayNumber] = useState(
    initialDayNumberToUse,
  );
  const [hours, setHours] = useState(initialInputs.hours);
  const [minutes, setMinutes] = useState(initialInputs.minutes);
  const [seconds, setSeconds] = useState(initialInputs.seconds);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const populateInputsForDate = (date: string) => {
    const existing = getExistingSecondsForDate(date);
    if (existing > 0) {
      const parts = decomposeSecondsToParts(existing);
      setHours(String(parts.hours));
      setMinutes(String(parts.minutes));
      setSeconds(String(parts.seconds));
    } else {
      setHours("");
      setMinutes("");
      setSeconds("");
    }
  };

  useEffect(() => {
    if (isOpen) {
      const dayNumberToUse =
        showYesterdayOption &&
        yesterdayDayNumber !== undefined &&
        initialDayNumber === yesterdayDayNumber
          ? yesterdayDayNumber
          : todayDayNumber;
      const dateToUse =
        dayNumberToUse === yesterdayDayNumber && yesterdayDate
          ? yesterdayDate
          : todayDate;
      setSelectedDayNumber(dayNumberToUse);
      if (initialHours > 0 || initialMinutes > 0 || initialSeconds > 0) {
        setHours(initialHours > 0 ? String(initialHours) : "");
        setMinutes(initialMinutes > 0 ? String(initialMinutes) : "");
        setSeconds(initialSeconds > 0 ? String(initialSeconds) : "");
      } else {
        populateInputsForDate(dateToUse);
      }
      setFeedback(null);
    }
  }, [
    isOpen,
    initialDayNumber,
    todayDate,
    todayDayNumber,
    yesterdayDate,
    yesterdayDayNumber,
    showYesterdayOption,
    todayLoggedSeconds,
    yesterdayLoggedSeconds,
    initialHours,
    initialMinutes,
    initialSeconds,
  ]);

  if (!isOpen) return null;

  const selectedDate =
    selectedDayNumber === yesterdayDayNumber && yesterdayDate
      ? yesterdayDate
      : todayDate;
  const isToday = selectedDayNumber === todayDayNumber;
  const isYesterday =
    yesterdayDayNumber !== undefined && selectedDayNumber === yesterdayDayNumber;
  const currentLoggedSeconds = getExistingSecondsForDate(selectedDate);
  const isUpdating = currentLoggedSeconds > 0;

  const handleDateChange = (newDayNumber: number) => {
    setSelectedDayNumber(newDayNumber);
    populateInputsForDate(
      newDayNumber === yesterdayDayNumber && yesterdayDate
        ? yesterdayDate
        : todayDate,
    );
    setFeedback(null);
  };

  const handleLog = (h: number, m: number, s: number) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await logStudyTimeAction({
        challengeId,
        challengeDay: selectedDayNumber,
        hours: h,
        minutes: m,
        seconds: s,
      });

      if (result.ok) {
        router.refresh();
        onSuccess?.();
        onClose();
      } else {
        setFeedback(result.message);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(hours || "0", 10);
    const m = parseInt(minutes || "0", 10);
    const s = parseInt(seconds || "0", 10);

    if (isNaN(h) || isNaN(m) || isNaN(s)) {
      setFeedback(
        "Please enter valid positive numbers for hours, minutes, and seconds.",
      );
      return;
    }

    handleLog(h, m, s);
  };

  const handleMarkAsLeave = () => {
    handleLog(0, 0, 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-[#434343] bg-[#292929] p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#ffffff]">
            {isYesterday
              ? "How much did you study yesterday?"
              : "How much did you study today?"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#868686] hover:text-[#ffffff] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {showYesterdayOption && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDateChange(todayDayNumber)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                isToday
                  ? "bg-[#ffffff] text-[#0d0d0d]"
                  : "bg-[#1c1c1c] text-[#868686] hover:text-[#ffffff]"
              }`}
            >
              Today ({todayDate})
            </button>
            <button
              type="button"
              onClick={() => handleDateChange(yesterdayDayNumber!)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                isYesterday
                  ? "bg-[#ffffff] text-[#0d0d0d]"
                  : "bg-[#1c1c1c] text-[#868686] hover:text-[#ffffff]"
              }`}
            >
              Yesterday ({yesterdayDate})
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#d1d1d1] mb-1">
                Hours
              </label>
              <Input
                type="number"
                min="0"
                max="24"
                placeholder="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="h-11 bg-[#545454] border-[#484848] text-[#ffffff] text-center font-sans font-sans-tabular text-base rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#d1d1d1] mb-1">
                Minutes
              </label>
              <Input
                type="number"
                min="0"
                max="59"
                placeholder="0"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="h-11 bg-[#545454] border-[#484848] text-[#ffffff] text-center font-sans font-sans-tabular text-base rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#d1d1d1] mb-1">
                Seconds
              </label>
              <Input
                type="number"
                min="0"
                max="59"
                placeholder="0"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className="h-11 bg-[#545454] border-[#484848] text-[#ffffff] text-center font-sans font-sans-tabular text-base rounded-xl"
              />
            </div>
          </div>

          {feedback && (
            <p className="text-xs text-[#ff5757] bg-[#381717] p-2.5 rounded-lg border border-[#ff5757]/30">
              {feedback}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
              className="h-10 px-4 rounded-xl bg-[#4a4a4a] text-[#ffffff] hover:bg-[#5a5a5a] text-xs font-medium"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleMarkAsLeave}
                disabled={isPending}
                className="h-10 px-3 rounded-xl bg-[#4a4a4a] border-none text-[#ffffff] hover:bg-[#5a5a5a] text-xs font-medium"
              >
                Mark as Leave
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="h-10 px-5 rounded-xl bg-[#ffffff] text-[#0d0d0d] hover:bg-[#e0e0e0] text-xs font-bold"
              >
                {isPending ? "Logging..." : isUpdating ? "Update Hours" : "Submit"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
