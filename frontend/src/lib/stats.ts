import type { Profile, WeightEntry } from "./types";
import { addDaysISO, parseISO, todayISO } from "./dates";

export interface BmiInfo {
  value: number;
  label: string;
  tone: "good" | "warn" | "bad";
}

export interface Stats {
  latest: WeightEntry | null;
  prev: WeightEntry | null;
  first: WeightEntry | null;
  changeLast: number | null;
  totalChange: number | null;
  weeklyRate: number | null;
  bmi: BmiInfo | null;
  streak: number;
  progress: number | null;
  remaining: number | null;
  etaISO: string | null;
  min: number | null;
  max: number | null;
}

function bmiCategory(v: number): { label: string; tone: "good" | "warn" | "bad" } {
  if (v < 18.5) return { label: "дефицит массы", tone: "warn" };
  if (v < 25) return { label: "норма", tone: "good" };
  if (v < 30) return { label: "избыточная масса", tone: "warn" };
  return { label: "ожирение", tone: "bad" };
}

export function computeStats(entries: WeightEntry[], profile: Profile): Stats {
  const latest = entries.length ? entries[entries.length - 1] : null;
  const prev = entries.length > 1 ? entries[entries.length - 2] : null;
  const first = entries.length ? entries[0] : null;

  const changeLast = latest && prev && Number.isFinite(latest.weight) && Number.isFinite(prev.weight) 
    ? latest.weight - prev.weight 
    : null;
  const totalChange = latest && first && Number.isFinite(latest.weight) && Number.isFinite(first.weight) 
    ? latest.weight - first.weight 
    : null;

  let weeklyRate: number | null = null;
  if (entries.length >= 3 && first) {
    const t0 = parseISO(first.date).getTime();
    const pts = entries.map((e) => ({
      x: (parseISO(e.date).getTime() - t0) / 86_400_000,
      y: e.weight,
    }));
    const n = pts.length;
    const sx = pts.reduce((s, p) => s + p.x, 0);
    const sy = pts.reduce((s, p) => s + p.y, 0);
    const sxx = pts.reduce((s, p) => s + p.x * p.x, 0);
    const sxy = pts.reduce((s, p) => s + p.x * p.y, 0);
    const denom = n * sxx - sx * sx;
    if (denom !== 0) {
      const rate = ((n * sxy - sx * sy) / denom) * 7;
      if (Number.isFinite(rate)) {
        weeklyRate = rate;
      }
    }
  }

  let bmi: BmiInfo | null = null;
  if (latest && Number.isFinite(latest.weight) && profile.heightCm > 0) {
    const h = profile.heightCm / 100;
    const v = latest.weight / (h * h);
    if (Number.isFinite(v)) {
      bmi = { value: v, ...bmiCategory(v) };
    }
  }

  const dates = new Set(entries.map((e) => e.date));
  let streak = 0;
  let cursor = todayISO();
  if (!dates.has(cursor)) cursor = addDaysISO(cursor, -1);
  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDaysISO(cursor, -1);
  }

  let progress: number | null = null;
  let remaining: number | null = null;
  let etaISO: string | null = null;
  const target = profile.target;
  if (target != null && latest && first && Number.isFinite(latest.weight) && Number.isFinite(first.weight) && first.weight !== target) {
    remaining = latest.weight - target;
    const raw =
      target < first.weight
        ? (first.weight - latest.weight) / (first.weight - target)
        : (latest.weight - first.weight) / (target - first.weight);
    progress = Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : null;

    if (weeklyRate != null && Math.abs(weeklyRate) > 0.01 && remaining !== 0) {
      const goodDirection =
        (remaining > 0 && weeklyRate < 0) || (remaining < 0 && weeklyRate > 0);
      if (goodDirection) {
        const weeks = Math.abs(remaining) / Math.abs(weeklyRate);
        if (weeks <= 104) {
          etaISO = addDaysISO(todayISO(), Math.max(1, Math.round(weeks * 7)));
        }
      }
    }
  }

  const weights = entries.map((e) => e.weight).filter(Number.isFinite);
  return {
    latest,
    prev,
    first,
    changeLast,
    totalChange,
    weeklyRate,
    bmi,
    streak,
    progress,
    remaining,
    etaISO,
    min: weights.length ? Math.min(...weights) : null,
    max: weights.length ? Math.max(...weights) : null,
  };
}
