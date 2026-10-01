export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISO(iso: string): Date {
  if (!iso || typeof iso !== 'string') {
    return new Date(NaN);
  }
  const parts = iso.split("-");
  if (parts.length !== 3) {
    return new Date(NaN);
  }
  const [y, m, d] = parts.map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return new Date(NaN);
  }
  return new Date(y, m - 1, d);
}

export const todayISO = (): string => toISO(new Date());

export function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISO(d);
}

export function addDaysISO(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function fmtDay(iso: string): string {
  const date = parseISO(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date
    .toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
    .replace(/\./g, "");
}

export function fmtFull(iso: string): string {
  const date = parseISO(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function fmtWeekday(iso: string): string {
  const date = parseISO(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return cap(date.toLocaleDateString("ru-RU", { weekday: "short" }));
}

export function fmtMonth(iso: string): string {
  const date = parseISO(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return cap(date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" }));
}

export function dayNum(iso: string): number {
  const date = parseISO(iso);
  const day = date.getDate();
  return Number.isFinite(day) ? day : 0;
}

export function fmtNum(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits).replace(".", ",");
}

export function fmtSigned(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "±";
  return `${sign}${fmtNum(Math.abs(n), digits)}`;
}
