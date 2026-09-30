# Масса — дневник контроля веса

Приложение для отслеживания веса с хранением данных в PostgreSQL.

## Структура проекта

```
.
├── frontend/          # React + Vite + чистый CSS
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── styles/    # CSS файлы
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── backend/           # Express + PostgreSQL
    ├── index.js       # REST API
    ├── db.js          # Подключение к БД
    ├── package.json
    └── .env.example
```

## Установка

### 1. Настройка PostgreSQL

Создайте базу данных:

```sql
CREATE DATABASE massa;
```

### 2. Настройка backend

```bash
cd backend
cp .env.example .env
# Отредактируйте .env — укажите параметры вашей PostgreSQL

npm install
```

### 3. Настройка frontend

```bash
cd frontend
npm install
```

## Запуск

### Backend

```bash
cd backend
npm start
```

Сервер будет доступен на `http://localhost:3001`

### Frontend (для разработки)

```bash
cd frontend
npm run dev
```

Frontend будет на `http://localhost:5173` с проксированием API запросов к backend.

### Production build

```bash
cd frontend
npm run build
```

Результат в `frontend/dist/`

## API Endpoints

### Записи веса

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/entries` | Получить все записи |
| POST | `/api/entries` | Создать/обновить запись |
| PATCH | `/api/entries/:id` | Обновить вес |
| DELETE | `/api/entries/:id` | Удалить запись |

### Профиль

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/profile` | Получить профиль |
| PUT | `/api/profile` | Обновить профиль |

### Утилиты

| Метод | Путь | Описание |
|-------|------|----------|
| DELETE | `/api/clear` | Очистить все данные |
| POST | `/api/init-db` | Инициализировать таблицы |

## Технологии

- **Frontend**: React 18, TypeScript, Vite, чистый CSS
- **Backend**: Express.js, node-pg
- **Database**: PostgreSQL

## Лицензия

MIT
