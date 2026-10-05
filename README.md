# Масса — дневник контроля веса

Приложение для отслеживания веса с хранением данных в PostgreSQL. Поддержка Docker и Kubernetes.

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

## Docker

### Локальный запуск через Docker Compose

```bash
# Копируем .env.example в .env и настраиваем пароль
cp backend/.env.example backend/.env

# Запускаем все сервисы
docker-compose up -d

# Проверяем статус
docker-compose ps

# Останавливаем
docker-compose down
```

Приложение будет доступно на http://localhost

### Сборка Docker образов

```bash
# Backend
docker build -t massa-backend:latest ./backend

# Frontend
docker build -t massa-frontend:latest ./frontend
```

## Kubernetes

### Структура манифестов

```
k8s/
├── 00-namespace.yaml      # Namespace
├── 01-configmap.yaml      # Конфигурация
├── 02-secret.yaml         # Секреты (пароли)
├── 03-postgres.yaml       # PostgreSQL StatefulSet
├── 04-backend.yaml        # Backend Deployment + Service
├── 05-frontend.yaml       # Frontend Deployment + Service
└── 06-ingress.yaml        # Ingress (опционально)
```

### Деплой в Kubernetes

#### Автоматический деплой

```bash
# Делаем скрипт исполняемым
chmod +x deploy.sh

# Запускаем деплой
./deploy.sh

# С Ingress
./deploy.sh --ingress
```

#### Ручной деплой

```bash
# Сборка образов
docker build -t massa-backend:latest ./backend
docker build -t massa-frontend:latest ./frontend

# Для minikube/kind - загрузка образов
minikube image load massa-backend:latest
minikube image load massa-frontend:latest

# Применение манифестов
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secret.yaml
kubectl apply -f k8s/03-postgres.yaml

# Ожидаем готовности PostgreSQL
kubectl wait --for=condition=ready pod -l app=postgres -n massa --timeout=120s

kubectl apply -f k8s/04-backend.yaml
kubectl apply -f k8s/05-frontend.yaml

# Опционально: Ingress
kubectl apply -f k8s/06-ingress.yaml
```

### Проверка статуса

```bash
# Поды
kubectl get pods -n massa

# Сервисы
kubectl get services -n massa

# Логи backend
kubectl logs -n massa deployment/backend

# Логи frontend
kubectl logs -n massa deployment/frontend
```

### Доступ к приложению

```bash
# Port forwarding
kubectl port-forward -n massa service/frontend 8080:80

# Откройте http://localhost:8080
```

### Удаление деплоя

```bash
# Автоматически
chmod +x undeploy.sh
./undeploy.sh

# Вручную
kubectl delete namespace massa
```

### Настройка секретов

Перед деплоем отредактируйте `k8s/02-secret.yaml` и замените base64-encoded значения:

```bash
# Генерация base64 для пароля
echo -n "your_secure_password" | base64
```

### Масштабирование

```bash
# Увеличить количество реплик backend
kubectl scale deployment backend -n massa --replicas=3

# Увеличить количество реплик frontend
kubectl scale deployment frontend -n massa --replicas=3
```

## Лицензия

MIT
