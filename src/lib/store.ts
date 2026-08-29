import type { Profile, WeightEntry } from "./types";
import { daysAgoISO, todayISO } from "./dates";

const ENTRIES_KEY = "massa.entries.v1";
const PROFILE_KEY = "massa.profile.v1";

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

export function loadEntries(): WeightEntry[] {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as WeightEntry[])
      .filter(
        (e) =>
          e &&
          typeof e.id === "string" &&
          typeof e.date === "string" &&
          typeof e.weight === "number" &&
          Number.isFinite(e.weight)
      )
      .sort(byDate);
  } catch {
    return [];
  }
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...defaultProfile };
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return {
      heightCm:
        typeof parsed.heightCm === "number" && parsed.heightCm > 0
          ? parsed.heightCm
          : defaultProfile.heightCm,
      age:
        typeof parsed.age === "number" && parsed.age > 0
          ? parsed.age
          : defaultProfile.age,
      sex: parsed.sex === "male" ? "male" : "female",
      target:
        typeof parsed.target === "number" && Number.isFinite(parsed.target)
          ? parsed.target
          : null,
    };
  } catch {
    return { ...defaultProfile };
  }
}

export function saveEntries(entries: WeightEntry[]): void {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  } catch {
    /* приватный режим — молча пропускаем */
  }
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* noop */
  }
}

const DEMO_NOTES = [
  "утром натощак",
  "после пробежки",
  "после зала",
  "день отдыха",
  "пешком 12 000 шагов",
];

/** Правдоподобные демо-данные: ~4 месяца, плавное снижение 87,6 → ~79 */
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
    if (i > 6 && rnd() < 0.24) continue; // пропускаем часть дней, как в жизни
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

  // гарантируем запись за сегодня
  if (entries[entries.length - 1]?.date !== todayISO()) {
    entries.push({ id: uid(), date: todayISO(), weight: Math.round(w * 10) / 10 });
  }

  return {
    entries: entries.sort(byDate),
    profile: { heightCm: 178, age: 29, sex: "male", target: 76 },
  };
}
