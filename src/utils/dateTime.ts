export const DHAKA_TIME_ZONE = "Asia/Dhaka";

const dhakaTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: DHAKA_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const dhakaDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: DHAKA_TIME_ZONE,
  month: "short",
  day: "numeric",
});

export function formatDhakaTime(value: string | Date | null | undefined): string {
  if (!value) return "Just now";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  return dhakaTimeFormatter.format(date);
}

export function formatDhakaDate(value: string | Date | null | undefined): string {
  if (!value) return "Recently";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return dhakaDateFormatter.format(date);
}
