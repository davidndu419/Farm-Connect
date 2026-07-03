const timeFormatter = new Intl.DateTimeFormat("en-NG", {
  hour: "2-digit",
  minute: "2-digit"
});

const dayFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short"
});

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit"
});

function isSameDay(first, second) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function formatConversationTime(value, now = new Date()) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (isSameDay(date, now)) return timeFormatter.format(date);
  if (date.getFullYear() === now.getFullYear()) {
    return dayFormatter.format(date);
  }
  return dateFormatter.format(date);
}

export function formatBubbleTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : timeFormatter.format(date);
}
