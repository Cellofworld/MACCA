# Быстрый старт

## Локальная разработка

### 1. Установка зависимостей

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Настройка базы данных

```bash
# Создайте базу данных PostgreSQL
createdb massa

# Выполните SQL скрипт
psql massa < init.sql
```

### 3. Запуск

```bash
# Терминал 1: Backend
cd backend
npm run dev

# Терминал 2: Frontend
cd frontend
npm run dev
```

Откройте http://localhost:5173

## Docker (рекомендуется)

### Быстрый запуск

```bash
# Копируем конфигурацию
cp .env.example .env

# Запускаем все сервисы
docker-compose up -d

# Проверяем статус
docker-compose ps

# Открываем http://localhost
```

### Остановка

```bash
docker-compose down
```

## Kubernetes

### Деплой

```bash
# Делаем скрипт исполняемым
chmod +x deploy.sh

# Запускаем деплой
./deploy.sh

# Для minikube/kind образы загрузятся автоматически
# Для других кластеров - загрузите образы в registry
```

### Доступ

```bash
# Port forwarding
kubectl port-forward -n massa service/frontend 8080:80

# Откройте http://localhost:8080
```

### Удаление

```bash
chmod +x undeploy.sh
./undeploy.sh
```

## Структура проекта

```
massa/
├── frontend/          # React + Vite + CSS
│   ├── src/
│   ├── Dockerfile
│   └── nginx.conf
├── backend/           # Express + PostgreSQL
│   ├── index.js
│   ├── db.js
│   └── Dockerfile
├── k8s/               # Kubernetes манифесты
│   ├── 00-namespace.yaml
│   ├── 01-configmap.yaml
│   ├── 02-secret.yaml
│   ├── 03-postgres.yaml
│   ├── 04-backend.yaml
│   ├── 05-frontend.yaml
│   └── 06-ingress.yaml
├── docker-compose.yml
├── init.sql           # SQL для инициализации БД
├── deploy.sh          # Скрипт деплоя в k8s
└── undeploy.sh        # Скрипт удаления из k8s
```

## Переменные окружения

### Backend (.env)

```env
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_password
PG_DATABASE=massa
PORT=3001
```

### Kubernetes

Отредактируйте `k8s/02-secret.yaml`:

```bash
# Генерация base64 для пароля
echo -n "your_password" | base64
```

## Полезные команды

```bash
# Локальная разработка
npm run dev              # Frontend
npm run server:dev       # Backend

# Docker
npm run docker:build     # Сборка образов
npm run docker:up        # Запуск
npm run docker:down      # Остановка
npm run docker:logs      # Логи

# Kubernetes
npm run k8s:deploy       # Деплой
npm run k8s:undeploy     # Удаление

# Проверка статуса k8s
kubectl get pods -n massa
kubectl get services -n massa
kubectl logs -n massa deployment/backend
```

## API Endpoints

- `GET /api/entries` - Получить все записи
- `POST /api/entries` - Создать/обновить запись
- `PATCH /api/entries/:id` - Обновить вес
- `DELETE /api/entries/:id` - Удалить запись
- `GET /api/profile` - Получить профиль
- `PUT /api/profile` - Обновить профиль
- `DELETE /api/clear` - Очистить все данные

## Поддержка

- PostgreSQL 16+
- Node.js 20+
- Docker 20+
- Kubernetes 1.20+
