-- Таблица записей веса
CREATE TABLE IF NOT EXISTS weight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  weight NUMERIC(5,2) NOT NULL CHECK (weight > 0 AND weight < 500),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Профиль пользователя
CREATE TABLE IF NOT EXISTS profile (
  id TEXT PRIMARY KEY DEFAULT 'main' CHECK (id = 'main'),
  height_cm INTEGER NOT NULL CHECK (height_cm > 0 AND height_cm < 300),
  age INTEGER NOT NULL CHECK (age > 0 AND age < 200),
  sex TEXT NOT NULL CHECK (sex IN ('female', 'male')),
  target NUMERIC(5,2)
);

-- Начальная строка профиля
INSERT INTO profile (id, height_cm, age, sex, target)
VALUES ('main', 170, 30, 'female', NULL)
ON CONFLICT (id) DO NOTHING;

-- Индекс для быстрого поиска по дате
CREATE INDEX IF NOT EXISTS idx_entries_date ON weight_entries(date);
