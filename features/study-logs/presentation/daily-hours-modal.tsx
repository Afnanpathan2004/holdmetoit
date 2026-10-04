"use client";

import { useState, useTransition } from "react";
import { X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logStudyTimeAction } from "@/features/study-logs/api/log-study-time.action";

interface DailyHoursModalProps {
  challengeId: string;
  isOpen: boolean;
  onClose: () => void;
  todayDate: string;
  yesterdayDate?: string;
  initialDate?: string;
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
  yesterdayDate,
  initialDate,
  initialHours = 0,
  initialMinutes = 0,
  initialSeconds = 0,
  onSuccess,
}: DailyHoursModalProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate || todayDate);
  const [hours, setHours] = useState(initialHours > 0 ? String(initialHours) : "");
  const [minutes, setMinutes] = useState(initialMinutes > 0 ? String(initialMinutes) : "");
  const [seconds, setSeconds] = useState(initialSeconds > 0 ? String(initialSeconds) : "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const isToday = selectedDate === todayDate;
  const isYesterday = yesterdayDate && selectedDate === yesterdayDate;

  const handleLog = (h: number, m: number, s: number) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await logStudyTimeAction({
        challengeId,
        logDate: selectedDate,
        hours: h,
        minutes: m,
        seconds: s,
      });

      if (result.ok) {
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
      setFeedback("Please enter valid positive numbers for hours, minutes, and seconds.");
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
            {isYesterday ? "How much did you study yesterday?" : "How much did you study today?"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#868686] hover:text-[#ffffff] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {yesterdayDate && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(todayDate)}
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
              onClick={() => setSelectedDate(yesterdayDate)}
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
              <label className="block text-xs font-medium text-[#d1d1d1] mb-1">Hours</label>
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
              <label className="block text-xs font-medium text-[#d1d1d1] mb-1">Minutes</label>
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
              <label className="block text-xs font-medium text-[#d1d1d1] mb-1">Seconds</label>
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
                {isPending ? "Logging..." : "Submit"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
