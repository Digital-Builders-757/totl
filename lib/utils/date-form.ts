/** Values for HTML `<input type="date">` and `datetime-local` from stored gig fields. */

export function formatDateForDateInput(date: string): string {
  if (!date) return "";
  return date.length >= 10 ? date.slice(0, 10) : date;
}

export function formatDeadlineForDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
