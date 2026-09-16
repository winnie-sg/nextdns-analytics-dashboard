/**
 * Convert an IANA time zone (for example Asia/Singapore) to a SQLite date/time
 * offset modifier for a representative instant in the query window.
 *
 * SQLite does not ship an IANA time-zone database, so this uses Intl to resolve
 * the UTC offset and then passes the fixed offset to SQLite's strftime().
 */
export function getSqliteTimezoneModifier(
  timeZone: string,
  at: Date = new Date()
): string {
  const instant = new Date(at);
  instant.setMilliseconds(0);

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(instant).map((part) => [part.type, part.value])
    );
    const wallClockAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );
    const offsetMinutes = Math.round(
      (wallClockAsUtc - instant.getTime()) / 60_000
    );
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const absolute = Math.abs(offsetMinutes);
    const hours = Math.floor(absolute / 60);
    const minutes = absolute % 60;
    return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  } catch {
    return "+00:00";
  }
}
