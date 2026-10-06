"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  captureLogRocketException,
  trackLogRocketEvent,
} from "@/core/observability/logrocket";
import { logStudyTimeAction } from "@/features/study-logs/api/log-study-time.actions";
import {
  decomposeSecondsToParts,
} from "@/features/study-logs/domain/duration";
import {
  getChallengeDayFromDateKey,
  getChallengeDayOptions,
  type ChallengeDayOption,
} from "@/features/study-logs/domain/challenge-day";

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
  challengeStartDate?: string;
  totalChallengeDays?: number;
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
  challengeStartDate,
  totalChallengeDays = 7,
}: DailyHoursModalProps) {
  const router = useRouter();
  const showYesterdayOption = Boolean(isYesterdayMissed && yesterdayDate);

  // Derive start date if not explicitly provided
  const effectiveStartDate = useMemo(() => {
    if (challengeStartDate) return challengeStartDate;
    const [y, m, d] = todayDate.split("-").map(Number);
    const todayUtc = Date.UTC(y, m - 1, d);
    const startUtc = new Date(todayUtc - (todayDayNumber - 1) * 86_400_000);
    return startUtc.toISOString().slice(0, 10);
  }, [challengeStartDate, todayDate, todayDayNumber]);

  // Generate selectable challenge days for the week
  const dayOptions: ChallengeDayOption[] = useMemo(() => {
    return getChallengeDayOptions(
      effectiveStartDate,
      todayDate,
      totalChallengeDays,
    );
  }, [effectiveStartDate, todayDate, totalChallengeDays]);

  const initialDayNumberToUse =
    initialDayNumber !== undefined &&
    initialDayNumber !== yesterdayDayNumber &&
    initialDayNumber <= todayDayNumber
      ? initialDayNumber
      : showYesterdayOption &&
        yesterdayDayNumber !== undefined &&
        initialDayNumber === yesterdayDayNumber
      ? yesterdayDayNumber
      : todayDayNumber;

  const initialDateToUse =
    initialDayNumberToUse === yesterdayDayNumber && yesterdayDate
      ? yesterdayDate
      : initialDayNumberToUse === todayDayNumber
      ? todayDate
      : dayOptions.find((d) => d.dayNumber === initialDayNumberToUse)?.dateKey || todayDate;

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

  const initialInputs = getInitialInputValues(initialDateToUse);
  const [selectedDayNumber, setSelectedDayNumber] = useState(
    initialDayNumberToUse,
  );
  const [selectedDate, setSelectedDate] = useState(initialDateToUse);
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
        initialDayNumber !== undefined &&
        initialDayNumber !== yesterdayDayNumber &&
        initialDayNumber <= todayDayNumber
          ? initialDayNumber
          : showYesterdayOption &&
            yesterdayDayNumber !== undefined &&
            initialDayNumber === yesterdayDayNumber
          ? yesterdayDayNumber
          : todayDayNumber;

      const dateToUse =
        dayNumberToUse === yesterdayDayNumber && yesterdayDate
          ? yesterdayDate
          : dayNumberToUse === todayDayNumber
          ? todayDate
          : dayOptions.find((d) => d.dayNumber === dayNumberToUse)?.dateKey || todayDate;

      setSelectedDayNumber(dayNumberToUse);
      setSelectedDate(dateToUse);

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
    dayOptions,
  ]);

  if (!isOpen) return null;

  const isToday =
    selectedDayNumber === todayDayNumber || selectedDate === todayDate;
  const isYesterday =
    (yesterdayDayNumber !== undefined && selectedDayNumber === yesterdayDayNumber) ||
    (yesterdayDate !== undefined && selectedDate === yesterdayDate);

  const currentLoggedSeconds = getExistingSecondsForDate(selectedDate);
  const isUpdating = currentLoggedSeconds > 0;

  const handleDateChange = (newDayNumber: number) => {
    const newDate =
      newDayNumber === yesterdayDayNumber && yesterdayDate
        ? yesterdayDate
        : dayOptions.find((d) => d.dayNumber === newDayNumber)?.dateKey || todayDate;

    if (newDate > todayDate || newDayNumber > todayDayNumber) {
      setFeedback("Cannot log study time for future dates.");
      return;
    }

    setSelectedDayNumber(newDayNumber);
    setSelectedDate(newDate);
    populateInputsForDate(newDate);
    setFeedback(null);
  };

  const handleSelectDay = (dayNum: number, dateKey: string) => {
    if (dayNum > todayDayNumber || dateKey > todayDate) {
      setFeedback("Cannot log study time for future dates.");
      return;
    }

    setSelectedDayNumber(dayNum);
    setSelectedDate(dateKey);
    populateInputsForDate(dateKey);
    setFeedback(null);
  };

  const handleDateInputChange = (newDate: string) => {
    if (!newDate) return;

    if (newDate > todayDate) {
      setFeedback("Cannot log study time for future dates.");
      return;
    }

    const minDateKey = dayOptions[0]?.dateKey;
    if (minDateKey && newDate < minDateKey) {
      setFeedback("Cannot log study time for dates before the challenge started.");
      return;
    }

    const newDayNumber = getChallengeDayFromDateKey(effectiveStartDate, newDate);
    if (newDayNumber < 1) {
      setFeedback("Cannot log study time for dates before the challenge started.");
      return;
    }
    if (newDayNumber > todayDayNumber) {
      setFeedback("Cannot log study time for future dates.");
      return;
    }

    setSelectedDate(newDate);
    setSelectedDayNumber(newDayNumber);
    populateInputsForDate(newDate);
    setFeedback(null);
  };

  const handleLog = (h: number, m: number, s: number) => {
    setFeedback(null);

    // Guard: Prevent logging for future dates
    if (selectedDate > todayDate || selectedDayNumber > todayDayNumber) {
      setFeedback("Cannot log study time for future dates.");
      return;
    }

    // Guard: Prevent logging for dates prior to challenge start
    if (selectedDayNumber < 1) {
      setFeedback("Cannot log study time for dates before the challenge started.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await logStudyTimeAction({
          challengeId,
          challengeDay: selectedDayNumber,
          date: selectedDate,
          hours: h,
          minutes: m,
          seconds: s,
        });

        if (result.ok) {
          trackLogRocketEvent("StudyTimeLogged", {
            challengeId,
            challengeDay: selectedDayNumber,
            date: selectedDate,
            hours: h,
            minutes: m,
            seconds: s,
          });
          router.refresh();
          onSuccess?.();
          onClose();
        } else {
          setFeedback(result.message);
        }
      } catch (error) {
        captureLogRocketException(error, {
          tags: { action: "log-study-time" },
          extra: {
            challengeId,
            challengeDay: selectedDayNumber,
            date: selectedDate,
          },
        });
        setFeedback("Could not save study time. Please try again.");
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

  const headerTitle = isToday
    ? "How much did you study today?"
    : isYesterday
    ? "How much did you study yesterday?"
    : `How much did you study on Day ${selectedDayNumber}?`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-[#434343] bg-[#292929] p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#ffffff]">{headerTitle}</h3>
            <p className="text-xs text-[#868686] mt-0.5">
              Day {selectedDayNumber} • {selectedDate}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#868686] hover:text-[#ffffff] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Missed Yesterday Quick Toggle Banner (Preserved for UX) */}
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

        {/* Day of the Week Selector Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-[#868686]">
            <span>Challenge Week Days</span>
            <span className="text-[#a1a1a1] font-sans-tabular">
              {selectedDate}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {dayOptions.map((opt) => {
              const isSelected = selectedDayNumber === opt.dayNumber;
              const hasLogged = Boolean(
                existingLogs &&
                  opt.dateKey in existingLogs &&
                  existingLogs[opt.dateKey] > 0,
              );

              return (
                <button
                  key={opt.dayNumber}
                  type="button"
                  disabled={opt.isFuture}
                  onClick={() => handleSelectDay(opt.dayNumber, opt.dateKey)}
                  className={`flex-1 min-w-[44px] py-1.5 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? "bg-[#ffffff] text-[#0d0d0d] font-bold shadow-md"
                      : opt.isFuture
                      ? "bg-[#1c1c1c]/40 text-[#545454] cursor-not-allowed border border-transparent"
                      : "bg-[#1c1c1c] text-[#d1d1d1] hover:bg-[#2f2f2f] hover:text-[#ffffff] border border-[#383838]"
                  }`}
                  title={
                    opt.isFuture ? "Future date (cannot log yet)" : opt.label
                  }
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-75 leading-none">
                    {opt.weekday}
                  </span>
                  <span className="text-xs font-semibold mt-1 leading-none">
                    {opt.isToday ? "Today" : `D${opt.dayNumber}`}
                  </span>
                  {hasLogged && !opt.isFuture && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full mt-1 ${
                        isSelected ? "bg-[#0d0d0d]" : "bg-[#22c55e]"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Date Picker Input (Guarded with max=todayDate) */}
          <div className="flex items-center justify-between gap-3 bg-[#1c1c1c] px-3 py-2 rounded-xl border border-[#383838]">
            <label
              htmlFor="log-date-picker"
              className="text-xs font-medium text-[#868686] flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5 text-[#a1a1a1]" />
              <span>Or pick date</span>
            </label>
            <input
              id="log-date-picker"
              type="date"
              min={dayOptions[0]?.dateKey}
              max={todayDate}
              value={selectedDate}
              onChange={(e) => handleDateInputChange(e.target.value)}
              className="bg-[#292929] border border-[#484848] text-[#ffffff] text-xs px-2.5 py-1 rounded-lg focus:outline-none focus:border-[#ffffff] font-sans-tabular"
            />
          </div>
        </div>

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
