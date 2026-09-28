# Масса — дневник контроля веса

Приложение для отслеживания веса с хранением данных в PostgreSQL.

## Возможности

- 📊 Динамический график веса с анимацией
- 🎯 Отслеживание прогресса к цели
- 📈 Анализ темпа, ИМТ, прогноз достижения цели
- 🔥 Серия взвешиваний подряд
- 💾 Хранение данных в PostgreSQL
- 📱 Полная адаптивность для мобильных устройств
- ✨ Демо-данные для быстрого старта

## Архитектура

```
┌─────────────┐      HTTP API      ┌──────────────┐      SQL       ┌────────────┐
│  Frontend   │ ◄────────────────► │  Express.js  │ ◄────────────► │ PostgreSQL │
│  (React)    │   /api/*           │  (server/)   │   node-pg      │  (your DB) │
└─────────────┘                    └──────────────┘                └────────────┘
```

- **Фронтенд** — React + TypeScript + Tailwind CSS (собирается через Vite)
- **Бэкенд** — Express.js сервер с REST API (`server/`)
- **База данных** — PostgreSQL на вашем сервере

## Установка

### 1. Настройка PostgreSQL

Создайте базу данных и выполните SQL-скрипт для создания таблиц:

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

### 2. Конфигурация

Скопируйте `.env.example` в `.env` и заполните параметры подключения к вашей PostgreSQL:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
# PostgreSQL Configuration
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_password_here
PG_DATABASE=massa

# Server Configuration
PORT=3001
```

### 3. Установка зависимостей

```bash
# Фронтенд
npm install

# Бэкенд
cd server
npm install
cd ..
```

### 4. Запуск

```bash
# Сборка фронтенда
npm run build

# Запуск сервера (из корня проекта)
cd server
npm start
```

Сервер будет доступен на `http://localhost:3001`

### 5. Для разработки

```bash
# Терминал 1: фронтенд с hot-reload
npm run dev

# Терминал 2: бэкенд с автоперезагрузкой
cd server
npm run dev
```

## Структура проекта

```
.
├── src/                    # Фронтенд (React)
│   ├── components/         # UI-компоненты
│   ├── lib/                # Утилиты и API-клиент
│   ├── App.tsx             # Главный компонент
│   └── main.tsx            # Точка входа
├── server/                 # Бэкенд (Express)
│   ├── index.js            # REST API
│   ├── db.js               # Подключение к PostgreSQL
│   └── package.json        # Зависимости сервера
├── .env                    # Конфигурация (не в git)
├── .env.example            # Пример конфигурации
└── README.md
```

## API Endpoints

### Записи веса

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/entries` | Получить все записи |
| POST | `/api/entries` | Создать/обновить запись (upsert по дате) |
| PATCH | `/api/entries/:id` | Обновить вес записи |
| DELETE | `/api/entries/:id` | Удалить запись |

### Профиль

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/profile` | Получить профиль |
| PUT | `/api/profile` | Обновить профиль |

### Утилиты

| Метод | Путь | Описание |
|-------|------|----------|
| DELETE | `/api/clear` | Удалить все данные |
| POST | `/api/init-db` | Инициализировать таблицы БД |

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

## Технологии

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS 4, Lucide React
- **Backend**: Express.js, node-pg, CORS, dotenv
- **Database**: PostgreSQL

## Лицензия

MIT
