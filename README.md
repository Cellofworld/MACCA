# Масса — дневник контроля веса

Приложение для отслеживания веса с поддержкой PostgreSQL через Supabase.

## Возможности

- 📊 Динамический график веса с анимацией
- 🎯 Отслеживание прогресса к цели
- 📈 Анализ темпа, ИМТ, прогноз достижения цели
- 🔥 Серия взвешиваний подряд
- 💾 Хранение данных в PostgreSQL (Supabase) или локально
- 📱 Полная адаптивность для мобильных устройств
- ✨ Демо-данные для быстрого старта

## Хранение данных

### Локальное хранилище (по умолчанию)

По умолчанию данные хранятся в `localStorage` браузера. Это работает сразу, без настройки.

### PostgreSQL через Supabase

Для синхронизации с PostgreSQL:

1. **Создайте проект на [Supabase](https://supabase.com)** (бесплатно)

2. **Выполните SQL-скрипт** в SQL Editor вашего проекта:

```sql
-- Таблица записей веса
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
```

3. **Скопируйте Project URL и anon public key** из Settings → API

4. **В приложении** нажмите "База данных" в меню и вставьте URL и ключ

5. **Готово!** Данные теперь синхронизируются с PostgreSQL

## Структура базы данных

### weight_entries
- `id` (uuid) — уникальный идентификатор
- `date` (date) — дата взвешивания (уникальная)
- `weight` (numeric) — вес в кг
- `note` (text) — заметка
- `created_at` (timestamptz) — время создания

### profile
- `id` (text) — всегда 'main'
- `height_cm` (integer) — рост в см
- `age` (integer) — возраст
- `sex` (text) — пол ('female' или 'male')
- `target` (numeric) — целевой вес в кг

## Безопасность

- **Anon-ключ** — публичный ключ Supabase, его можно хранить в клиенте
- **RLS (Row Level Security)** включен с политиками "allow all" для демонстрации
- Для продакшена настройте политики по пользователю через Supabase Auth

## Технологии

- React 18 + TypeScript
- Vite
- Tailwind CSS 4
- Supabase (PostgreSQL)
- Lucide React (иконки)

## Разработка

```bash
npm install
npm run dev
```

## Сборка

```bash
npm run build
```

Результат в `dist/` — статические файлы, готовые к деплою.

## Лицензия

MIT
