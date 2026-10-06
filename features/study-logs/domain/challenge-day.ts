const SECONDS_PER_DAY = 86_400;
const MILLISECONDS_PER_DAY = SECONDS_PER_DAY * 1_000;

export interface ChallengeDayBucket {
  dayNumber: number;
  dateKey: string;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function formatUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getChallengeDayNumber(
  startAt: Date | string,
  now: Date | string,
): number {
  const elapsedMilliseconds = toDate(now).getTime() - toDate(startAt).getTime();

  if (elapsedMilliseconds < 0) {
    return 0;
  }

  return Math.floor(elapsedMilliseconds / MILLISECONDS_PER_DAY) + 1;
}

export function getChallengeDayDateKey(
  startAt: Date | string,
  dayNumber: number,
): string {
  if (!Number.isInteger(dayNumber) || dayNumber < 1) {
    throw new RangeError("Challenge day number must be a positive integer.");
  }

  const dayStart = new Date(
    toDate(startAt).getTime() + (dayNumber - 1) * MILLISECONDS_PER_DAY,
  );

  return formatUtcDateKey(dayStart);
}

export function getChallengeDayBuckets(
  startAt: Date | string,
  now: Date | string,
): { current: ChallengeDayBucket; previous: ChallengeDayBucket | null } {
  const currentDayNumber = Math.max(1, getChallengeDayNumber(startAt, now));
  const current = {
    dayNumber: currentDayNumber,
    dateKey: getChallengeDayDateKey(startAt, currentDayNumber),
  };

  if (currentDayNumber === 1) {
    return { current, previous: null };
  }

  const previousDayNumber = currentDayNumber - 1;
  return {
    current,
    previous: {
      dayNumber: previousDayNumber,
      dateKey: getChallengeDayDateKey(startAt, previousDayNumber),
    },
  };
}

export function getChallengeDayFromDateKey(
  startAt: Date | string,
  dateKey: string,
): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new TypeError("dateKey must be in YYYY-MM-DD format.");
  }

  const day1Key = getChallengeDayDateKey(startAt, 1);
  const [y1, m1, d1] = day1Key.split("-").map(Number);
  const [y2, m2, d2] = dateKey.split("-").map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const diffDays = Math.round((utc2 - utc1) / MILLISECONDS_PER_DAY);
  return diffDays + 1;
}

export interface ChallengeDayOption {
  dayNumber: number;
  dateKey: string;
  label: string;
  shortLabel: string;
  weekday: string;
  isToday: boolean;
  isYesterday: boolean;
  isFuture: boolean;
}

export function getChallengeDayOptions(
  startAt: Date | string,
  now: Date | string = new Date(),
  totalDays = 7,
): ChallengeDayOption[] {
  const currentDayNumber = Math.max(1, getChallengeDayNumber(startAt, now));
  const daysCount = Math.max(totalDays, currentDayNumber);
  const options: ChallengeDayOption[] = [];

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let d = 1; d <= daysCount; d++) {
    const dateKey = getChallengeDayDateKey(startAt, d);
    const [year, month, day] = dateKey.split("-").map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    const weekday = WEEKDAYS[dateObj.getUTCDay()];

    const isToday = d === currentDayNumber;
    const isYesterday = d === currentDayNumber - 1;
    const isFuture = d > currentDayNumber;

    let label = `Day ${d} (${weekday})`;
    if (isToday) label = `Today (Day ${d})`;
    else if (isYesterday) label = `Yesterday (Day ${d})`;

    options.push({
      dayNumber: d,
      dateKey,
      label,
      shortLabel: `Day ${d}`,
      weekday,
      isToday,
      isYesterday,
      isFuture,
    });
  }

  return options;
}

export function getCalendarWeekDayOptions(
  now: Date | string = new Date(),
): ChallengeDayOption[] {
  const nowDate = toDate(now);
  const nowYear = nowDate.getUTCFullYear();
  const nowMonth = nowDate.getUTCMonth();
  const nowDateNum = nowDate.getUTCDate();
  const todayUtc = Date.UTC(nowYear, nowMonth, nowDateNum);
  const todayObj = new Date(todayUtc);
  const todayDateKey = formatUtcDateKey(todayObj);

  // ISO week: Monday = 1, Sunday = 7
  const dayOfWeek = todayObj.getUTCDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const mondayUtc = todayUtc - daysSinceMonday * MILLISECONDS_PER_DAY;

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const options: ChallengeDayOption[] = [];

  for (let i = 0; i < 7; i++) {
    const dayUtc = mondayUtc + i * MILLISECONDS_PER_DAY;
    const dayDate = new Date(dayUtc);
    const dateKey = formatUtcDateKey(dayDate);
    const weekday = WEEKDAYS[dayDate.getUTCDay()];
    const dayNumber = i + 1;
    const isToday = dateKey === todayDateKey;
    const isYesterday = dayUtc === todayUtc - MILLISECONDS_PER_DAY;
    const isFuture = dayUtc > todayUtc;

    let label = `Day ${dayNumber} (${weekday})`;
    if (isToday) label = `Today (${weekday})`;
    else if (isYesterday) label = `Yesterday (${weekday})`;

    options.push({
      dayNumber,
      dateKey,
      label,
      shortLabel: weekday,
      weekday,
      isToday,
      isYesterday,
      isFuture,
    });
  }

  return options;
}

export type ValidateChallengeDayResult =
  | { ok: true; dayNumber: number; dateKey: string }
  | { ok: false; code: string; message: string };

export function validateStudyLogChallengeDay(
  startAt: Date | string,
  input: { challengeDay?: number; date?: string },
  now: Date | string = new Date(),
): ValidateChallengeDayResult {
  const currentDayNumber = Math.max(1, getChallengeDayNumber(startAt, now));
  const todayDateKey = getChallengeDayDateKey(startAt, currentDayNumber);
  const day1DateKey = getChallengeDayDateKey(startAt, 1);

  let resolvedDayNumber: number;
  let resolvedDateKey: string;

  if (input.date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
      return {
        ok: false,
        code: "INVALID_DATE_FORMAT",
        message: "Date must be in YYYY-MM-DD format.",
      };
    }
    resolvedDayNumber = getChallengeDayFromDateKey(startAt, input.date);
    resolvedDateKey = input.date;

    if (
      input.challengeDay !== undefined &&
      input.challengeDay !== resolvedDayNumber
    ) {
      return {
        ok: false,
        code: "MISMATCHED_DATE_AND_DAY",
        message: "The provided challenge day and date do not match.",
      };
    }
  } else if (input.challengeDay !== undefined) {
    if (!Number.isInteger(input.challengeDay) || input.challengeDay < 1) {
      return {
        ok: false,
        code: "DATE_BEFORE_CHALLENGE",
        message: "Cannot log study time for days before the challenge started.",
      };
    }
    resolvedDayNumber = input.challengeDay;
    resolvedDateKey = getChallengeDayDateKey(startAt, resolvedDayNumber);
  } else {
    return {
      ok: false,
      code: "MISSING_DAY_OR_DATE",
      message: "Please specify a challenge day or date to log study time.",
    };
  }

  if (resolvedDayNumber < 1 || resolvedDateKey < day1DateKey) {
    return {
      ok: false,
      code: "DATE_BEFORE_CHALLENGE",
      message: "Cannot log study time for dates before the challenge started.",
    };
  }

  if (resolvedDayNumber > currentDayNumber || resolvedDateKey > todayDateKey) {
    return {
      ok: false,
      code: "FUTURE_DATE_NOT_ALLOWED",
      message: "Cannot log study time for future dates.",
    };
  }

  return {
    ok: true,
    dayNumber: resolvedDayNumber,
    dateKey: resolvedDateKey,
  };
}

