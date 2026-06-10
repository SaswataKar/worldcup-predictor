
export const userTZ = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

// Returns YYYY-MM-DD in the user's local timezone (en-CA locale always gives that format)
export const toLocalDateKey = (d: Date, tz?: string): string =>
  d.toLocaleDateString("en-CA", { timeZone: tz ?? userTZ() });

// Short timezone label e.g. "IST", "EST", "PST"
export const tzLabel = (tz?: string): string => {
  const zone = tz ?? userTZ();
  return new Date().toLocaleTimeString("en-US", { timeZone: zone, timeZoneName: "short" })
    .split(" ").pop() ?? zone;
};
