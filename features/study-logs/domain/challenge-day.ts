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
