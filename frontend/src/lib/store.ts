import type { Profile, WeightEntry } from "./types";
import { daysAgoISO, todayISO } from "./dates";

export const defaultProfile: Profile = {
  heightCm: 170,
  age: 30,
  sex: "female",
  target: null,
};

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const byDate = (a: WeightEntry, b: WeightEntry) => a.date.localeCompare(b.date);

const DEMO_NOTES = [
  "утром натощак",
  "после пробежки",
  "после зала",
  "день отдыха",
  "пешком 12 000 шагов",
];

export function makeDemoData(): { entries: WeightEntry[]; profile: Profile } {
  let seed = 42;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const entries: WeightEntry[] = [];
  const days = 118;
  let w = 87.6;

  for (let i = days; i >= 0; i--) {
    if (i > 6 && rnd() < 0.24) continue;
    w = Math.max(78.2, w - 0.065 + (rnd() - 0.47) * 0.48);
    const weight = Math.round(w * 10) / 10;
    const withNote = rnd() < 0.12;
    entries.push({
      id: uid(),
      date: daysAgoISO(i),
      weight,
      note: withNote ? DEMO_NOTES[Math.floor(rnd() * DEMO_NOTES.length)] : undefined,
    });
  }

  if (entries[entries.length - 1]?.date !== todayISO()) {
    entries.push({ id: uid(), date: todayISO(), weight: Math.round(w * 10) / 10 });
  }

  return {
    entries: entries.sort(byDate),
    profile: { heightCm: 178, age: 29, sex: "male", target: 76 },
  };
}
