function localHour(date: Date, timezone: string): number {
  const hour = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "2-digit", hour12: false }).format(date);
  return Number(hour) % 24;
}

export function nextRun(
  now: Date,
  timezone: string,
  dayStartHour: number,
  dayEndHour: number,
  minIntervalHours: number,
  maxIntervalHours: number,
  random = Math.random
): Date {
  const interval = minIntervalHours + random() * (maxIntervalHours - minIntervalHours);
  let candidate = new Date(now.getTime() + interval * 3_600_000);
  for (let attempts = 0; attempts < 48; attempts += 1) {
    const hour = localHour(candidate, timezone);
    if (hour >= dayStartHour && hour < dayEndHour) return candidate;
    candidate = new Date(candidate.getTime() + 3_600_000);
  }
  return candidate;
}

export function retryAt(now: Date): Date {
  return new Date(now.getTime() + 60 * 60 * 1000);
}
