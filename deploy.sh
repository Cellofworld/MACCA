#!/bin/bash

# Скрипт для деплоя приложения Massa в Kubernetes

set -e

echo "🚀 Деплой приложения Massa в Kubernetes"
echo "========================================"

# Проверяем наличие kubectl
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl не найден. Установите kubectl."
    exit 1
fi

# Проверяем наличие docker
if ! command -v docker &> /dev/null; then
    echo "❌ docker не найден. Установите docker."
    exit 1
fi

# Собираем Docker образы
echo ""
echo "📦 Сборка Docker образов..."
echo "----------------------------"

echo "Сборка backend..."
docker build -t massa-backend:latest ./backend

echo "Сборка frontend..."
docker build -t massa-frontend:latest ./frontend

# Если используется локальный k8s (minikube, kind, etc.), загружаем образы
if command -v minikube &> /dev/null; then
    echo ""
    echo "📥 Загрузка образов в minikube..."
    minikube image load massa-backend:latest
    minikube image load massa-frontend:latest
fi

# Применяем Kubernetes манифесты
echo ""
echo "🎯 Применение Kubernetes манифестов..."
echo "--------------------------------------"

kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secret.yaml
kubectl apply -f k8s/03-postgres.yaml

echo "⏳ Ожидание готовности PostgreSQL..."
kubectl wait --for=condition=ready pod -l app=postgres -n massa --timeout=120s

kubectl apply -f k8s/04-backend.yaml
kubectl apply -f k8s/05-frontend.yaml

# Опционально: применяем Ingress
if [ "$1" == "--ingress" ]; then
    echo ""
    echo "🌐 Применение Ingress..."
    kubectl apply -f k8s/06-ingress.yaml
fi

# Ждем готовности всех подов
echo ""
echo "⏳ Ожидание готовности всех подов..."
kubectl wait --for=condition=ready pod -l app=backend -n massa --timeout=120s
kubectl wait --for=condition=ready pod -l app=frontend -n massa --timeout=120s

# Показываем статус
echo ""
echo "✅ Деплой завершён!"
echo "==================="
echo ""
kubectl get pods -n massa
echo ""
kubectl get services -n massa

# Получаем внешний IP (если есть)
EXTERNAL_IP=$(kubectl get service frontend -n massa -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
if [ -n "$EXTERNAL_IP" ]; then
    echo ""
    echo "🌍 Приложение доступно по адресу: http://$EXTERNAL_IP"
else
    echo ""
    echo "📝 Для доступа к приложению используйте:"
    echo "   kubectl port-forward -n massa service/frontend 8080:80"
    echo "   Затем откройте: http://localhost:8080"
fi
