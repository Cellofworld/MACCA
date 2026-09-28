import type { Profile, WeightEntry } from "./types";
import { createSupabaseClient, getSupabaseConfig, isSupabaseConfigured } from "./supabase";
import {
  defaultProfile,
  loadEntries as loadLocalEntries,
  loadProfile as loadLocalProfile,
  saveEntries as saveLocalEntries,
  saveProfile as saveLocalProfile,
} from "./store";

/* ---------- SQL для инициализации ---------- */

export const SCHEMA_SQL = `-- Таблица записей веса
create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  weight numeric(5,2) not null check (weight > 0 and weight < 500),
  note text,
  created_at timestamptz default now()
);

-- Профиль (одна строка)
create table if not exists public.profile (
  id text primary key default 'main' check (id = 'main'),
  height_cm integer not null check (height_cm > 0 and height_cm < 300),
  age integer not null check (age > 0 and age < 200),
  sex text not null check (sex in ('female', 'male')),
  target numeric(5,2)
);

-- Начальная строка профиля
insert into public.profile (id, height_cm, age, sex, target)
values ('main', 170, 30, 'female', null)
on conflict (id) do nothing;

-- RLS: разрешаем всё для anon-ключа (для демо)
-- В продакшене настройте политики по пользователю
alter table public.weight_entries enable row level security;
alter table public.profile enable row level security;

drop policy if exists "allow all entries" on public.weight_entries;
drop policy if exists "allow all profile" on public.profile;

create policy "allow all entries" on public.weight_entries
  for all using (true) with check (true);

create policy "allow all profile" on public.profile
  for all using (true) with check (true);

-- Индексы
create index if not exists idx_entries_date on public.weight_entries(date);
`;

/* ---------- типы строк БД ---------- */

interface DbEntry {
  id: string;
  date: string;
  weight: number;
  note: string | null;
  created_at?: string;
}

interface DbProfile {
  id: string;
  height_cm: number;
  age: number;
  sex: "female" | "male";
  target: number | null;
}

/* ---------- helpers ---------- */

function toEntry(row: DbEntry): WeightEntry {
  return {
    id: row.id,
    date: row.date,
    weight: Number(row.weight),
    note: row.note || undefined,
  };
}

function toProfile(row: DbProfile): Profile {
  return {
    heightCm: row.height_cm,
    age: row.age,
    sex: row.sex,
    target: row.target != null ? Number(row.target) : null,
  };
}

/* ---------- CRUD ---------- */

export async function loadEntries(): Promise<WeightEntry[]> {
  if (!isSupabaseConfigured()) return loadLocalEntries();

  const { url, key } = getSupabaseConfig();
  const client = createSupabaseClient(url, key);
  const { data, error } = await client
    .from("weight_entries")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.error("loadEntries error:", error);
    return loadLocalEntries();
  }

  return (data as DbEntry[]).map(toEntry);
}

export async function saveEntries(entries: WeightEntry[]): Promise<void> {
  // В Supabase мы не храним весь массив — только отдельные записи.
  // Эта функция вызывается при каждом изменении, но мы не хотим перезаписывать всё.
  // Поэтому здесь просто синхронизируем с localStorage как fallback.
  saveLocalEntries(entries);
}

export async function upsertEntry(entry: WeightEntry): Promise<void> {
  if (!isSupabaseConfigured()) {
    // fallback: сохраняем в localStorage
    const current = loadLocalEntries();
    const filtered = current.filter((e) => e.date !== entry.date);
    saveLocalEntries([...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)));
    return;
  }

  const { url, key } = getSupabaseConfig();
  const client = createSupabaseClient(url, key);

  const { error } = await client.from("weight_entries").upsert(
    {
      id: entry.id,
      date: entry.date,
      weight: entry.weight,
      note: entry.note || null,
    },
    { onConflict: "date" }
  );

  if (error) {
    console.error("upsertEntry error:", error);
    throw error;
  }
}

export async function deleteEntry(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const current = loadLocalEntries();
    saveLocalEntries(current.filter((e) => e.id !== id));
    return;
  }

  const { url, key } = getSupabaseConfig();
  const client = createSupabaseClient(url, key);

  const { error } = await client.from("weight_entries").delete().eq("id", id);

  if (error) {
    console.error("deleteEntry error:", error);
    throw error;
  }
}

export async function updateEntryWeight(id: string, weight: number): Promise<void> {
  if (!isSupabaseConfigured()) {
    const current = loadLocalEntries();
    saveLocalEntries(current.map((e) => (e.id === id ? { ...e, weight } : e)));
    return;
  }

  const { url, key } = getSupabaseConfig();
  const client = createSupabaseClient(url, key);

  const { error } = await client.from("weight_entries").update({ weight }).eq("id", id);

  if (error) {
    console.error("updateEntryWeight error:", error);
    throw error;
  }
}

export async function loadProfile(): Promise<Profile> {
  if (!isSupabaseConfigured()) return loadLocalProfile();

  const { url, key } = getSupabaseConfig();
  const client = createSupabaseClient(url, key);

  const { data, error } = await client
    .from("profile")
    .select("*")
    .eq("id", "main")
    .single();

  if (error || !data) {
    console.error("loadProfile error:", error);
    return loadLocalProfile();
  }

  return toProfile(data as DbProfile);
}

export async function saveProfile(profile: Profile): Promise<void> {
  if (!isSupabaseConfigured()) {
    saveLocalProfile(profile);
    return;
  }

  const { url, key } = getSupabaseConfig();
  const client = createSupabaseClient(url, key);

  const { error } = await client
    .from("profile")
    .update({
      height_cm: profile.heightCm,
      age: profile.age,
      sex: profile.sex,
      target: profile.target,
    })
    .eq("id", "main");

  if (error) {
    console.error("saveProfile error:", error);
    throw error;
  }
}

export async function clearAllData(): Promise<void> {
  if (!isSupabaseConfigured()) {
    saveLocalEntries([]);
    saveLocalProfile({ ...defaultProfile });
    return;
  }

  const { url, key } = getSupabaseConfig();
  const client = createSupabaseClient(url, key);

  await client.from("weight_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await client
    .from("profile")
    .update({ height_cm: 170, age: 30, sex: "female", target: null })
    .eq("id", "main");
}
