import type { Profile, WeightEntry } from "./types";
import { defaultProfile } from "./store";

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
    console.warn("API недоступен:", err);
    return [];
  }
}

export async function upsertEntry(entry: WeightEntry): Promise<void> {
  await apiRequest("/api/entries", {
    method: "POST",
    body: JSON.stringify({
      id: entry.id,
      date: entry.date,
      weight: entry.weight,
      note: entry.note || null,
    }),
  });
}

export async function deleteEntry(id: string): Promise<void> {
  await apiRequest(`/api/entries/${id}`, { method: "DELETE" });
}

export async function updateEntryWeight(id: string, weight: number): Promise<void> {
  await apiRequest(`/api/entries/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ weight }),
  });
}

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
    console.warn("API недоступен:", err);
    return { ...defaultProfile };
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  await apiRequest("/api/profile", {
    method: "PUT",
    body: JSON.stringify({
      height_cm: profile.heightCm,
      age: profile.age,
      sex: profile.sex,
      target: profile.target,
    }),
  });
}

export async function clearAllData(): Promise<void> {
  try {
    await apiRequest("/api/clear", { method: "DELETE" });
  } catch (err) {
    console.error("clearAllData error:", err);
  }
}
