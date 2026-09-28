# Инструкция по установке и запуску

## Быстрый старт

### 1. Создайте базу данных PostgreSQL

```sql
CREATE DATABASE massa;
```

### 2. Выполните SQL-скрипт для создания таблиц

```sql
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
```

### 3. Настройте конфигурацию

```bash
cp .env.example .env
nano .env  # или любой другой редактор
```

Заполните параметры подключения к вашей PostgreSQL:

```env
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_password_here
PG_DATABASE=massa
PORT=3001
```

### 4. Установите зависимости

```bash
# Фронтенд
npm install

# Бэкенд
cd server
npm install
cd ..
```

### 5. Запустите приложение

```bash
# Сборка фронтенда
npm run build

# Запуск сервера
cd server
npm start
```

Откройте браузер: `http://localhost:3001`

## Для разработки

Откройте два терминала:

**Терминал 1 — фронтенд:**
```bash
npm run dev
```

**Терминал 2 — бэкенд:**
```bash
cd server
npm run dev
```

Фронтенд будет на `http://localhost:5173` (Vite dev server)
Бэкенд будет на `http://localhost:3001`

Для разработки настройте `VITE_API_URL` в `.env` фронтенда:
```env
VITE_API_URL=http://localhost:3001
```

## Структура проекта

```
.
├── src/                    # Фронтенд (React + TypeScript)
├── server/                 # Бэкенд (Express + PostgreSQL)
├── .env                    # Конфигурация подключения к БД
└── README.md               # Полная документация
```

## API Endpoints

Все endpoints доступны на `http://localhost:3001/api/`

- `GET /api/entries` — получить все записи
- `POST /api/entries` — создать/обновить запись
- `PATCH /api/entries/:id` — обновить вес
- `DELETE /api/entries/:id` — удалить запись
- `GET /api/profile` — получить профиль
- `PUT /api/profile` — обновить профиль
- `DELETE /api/clear` — очистить все данные
- `POST /api/init-db` — инициализировать таблицы БД

## Подключение к удалённой PostgreSQL

Если ваша PostgreSQL на другом сервере, укажите его адрес в `.env`:

```env
PG_HOST=your-server.com
PG_PORT=5432
PG_USER=your_user
PG_PASSWORD=your_password
PG_DATABASE=massa
```

Убедитесь, что PostgreSQL принимает внешние подключения (настройте `postgresql.conf` и `pg_hba.conf`).
