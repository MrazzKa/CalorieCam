#!/bin/bash

echo "🚀 Запуск EatSense локально через Expo Go"
echo ""

# Проверка Node.js
echo "📦 Проверка Node.js..."
node --version || { echo "❌ Node.js не установлен"; exit 1; }

# Установка зависимостей
echo ""
echo "📦 Установка зависимостей..."
npm install

# Обновление Expo зависимостей
echo ""
echo "🔄 Обновление Expo зависимостей до SDK 54..."
npx expo install --fix

echo ""
echo "✅ Готово! Теперь запустите:"
echo ""
echo "1. Backend (в отдельном терминале):"
echo "   cd apps/api && npm run start:dev"
echo ""
echo "2. Frontend:"
echo "   npm run start:lan"
echo ""
echo "3. Откройте Expo Go на iPhone и отсканируйте QR-код"

