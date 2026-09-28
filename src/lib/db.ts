import type { Profile, WeightEntry } from "./types";
import {
  defaultProfile,
  loadEntries as loadLocalEntries,
  loadProfile as loadLocalProfile,
  saveEntries as saveLocalEntries,
  saveProfile as saveLocalProfile,
} from "./store";

// API_BASE_URL можно переопределить через Vite env
const API_BASE = (import.meta as any).env?.VITE_API_URL || "";

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

// ========== Записи ==========

export async function loadEntries(): Promise<WeightEntry[]> {
  try {
    const rows = await apiRequest<
      { id: string; date: string; weight: number; note: string | null }[]
    >("/api/entries");
    return rows.map((r) => ({
      id: r.id,
      date: r.date,
      weight: Number(r.weight),
      note: r.note || undefined,
    }));
  } catch (err) {
    console.warn("API недоступен, использую localStorage:", err);
    return loadLocalEntries();
  }
}

export async function saveEntries(entries: WeightEntry[]): Promise<void> {
  // Локальный кэш на случай отключения API
  saveLocalEntries(entries);
}

export async function upsertEntry(entry: WeightEntry): Promise<void> {
  try {
    await apiRequest("/api/entries", {
      method: "POST",
      body: JSON.stringify({
        id: entry.id,
        date: entry.date,
        weight: entry.weight,
        note: entry.note || null,
      }),
    });
    // Обновляем локальный кэш
    const current = loadLocalEntries();
    const filtered = current.filter((e) => e.date !== entry.date);
    saveLocalEntries([...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)));
  } catch (err) {
    console.error("upsertEntry error:", err);
    // Fallback на localStorage
    const current = loadLocalEntries();
    const filtered = current.filter((e) => e.date !== entry.date);
    saveLocalEntries([...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)));
    throw err;
  }
}

export async function deleteEntry(id: string): Promise<void> {
  try {
    await apiRequest(`/api/entries/${id}`, { method: "DELETE" });
    const current = loadLocalEntries();
    saveLocalEntries(current.filter((e) => e.id !== id));
  } catch (err) {
    console.error("deleteEntry error:", err);
    const current = loadLocalEntries();
    saveLocalEntries(current.filter((e) => e.id !== id));
    throw err;
  }
}

export async function updateEntryWeight(id: string, weight: number): Promise<void> {
  try {
    await apiRequest(`/api/entries/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ weight }),
    });
    const current = loadLocalEntries();
    saveLocalEntries(current.map((e) => (e.id === id ? { ...e, weight } : e)));
  } catch (err) {
    console.error("updateEntryWeight error:", err);
    const current = loadLocalEntries();
    saveLocalEntries(current.map((e) => (e.id === id ? { ...e, weight } : e)));
    throw err;
  }
}

// ========== Профиль ==========

export async function loadProfile(): Promise<Profile> {
  try {
    const row = await apiRequest<{
      height_cm: number;
      age: number;
      sex: "female" | "male";
      target: number | null;
    }>("/api/profile");
    return {
      heightCm: row.height_cm,
      age: row.age,
      sex: row.sex,
      target: row.target != null ? Number(row.target) : null,
    };
  } catch (err) {
    console.warn("API недоступен, использую localStorage:", err);
    return loadLocalProfile();
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  try {
    await apiRequest("/api/profile", {
      method: "PUT",
      body: JSON.stringify({
        height_cm: profile.heightCm,
        age: profile.age,
        sex: profile.sex,
        target: profile.target,
      }),
    });
    saveLocalProfile(profile);
  } catch (err) {
    console.error("saveProfile error:", err);
    saveLocalProfile(profile);
    throw err;
  }
}

// ========== Очистка ==========

export async function clearAllData(): Promise<void> {
  try {
    await apiRequest("/api/clear", { method: "DELETE" });
  } catch (err) {
    console.error("clearAllData error:", err);
  }
  saveLocalEntries([]);
  saveLocalProfile({ ...defaultProfile });
}

// ========== Инициализация БД ==========

export async function initDatabase(): Promise<void> {
  try {
    await apiRequest("/api/init-db", { method: "POST" });
    console.log("База данных инициализирована");
  } catch (err) {
    console.error("initDatabase error:", err);
    throw err;
  }
}
