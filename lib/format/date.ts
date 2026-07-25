const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatShortDateUtc(date: Date) {
  const month = SHORT_MONTHS[date.getUTCMonth()];
  const year = String(date.getUTCFullYear()).slice(-2);

  return `${month} ${date.getUTCDate()}, ${year}`;
}

export function formatDateTimeUtc(date: Date) {
  const month = SHORT_MONTHS[date.getUTCMonth()];
  const hours = date.getUTCHours();
  const displayHours = hours % 12 || 12;
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const period = hours < 12 ? "AM" : "PM";

  return `${month} ${date.getUTCDate()}, ${date.getUTCFullYear()}, ${displayHours}:${minutes} ${period} UTC`;
}
