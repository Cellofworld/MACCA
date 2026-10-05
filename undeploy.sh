#!/bin/bash

# Скрипт для удаления деплоя приложения Massa из Kubernetes

set -e

echo "🗑️  Удаление деплоя приложения Massa из Kubernetes"
echo "==================================================="

# Проверяем наличие kubectl
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl не найден. Установите kubectl."
    exit 1
fi

# Подтверждение
read -p "Вы уверены, что хотите удалить все ресурсы? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено."
    exit 0
fi

# Удаляем все ресурсы в namespace massa
echo ""
echo "Удаление ресурсов..."
kubectl delete namespace massa --ignore-not-found=true

echo ""
echo "✅ Деплой удалён!"
