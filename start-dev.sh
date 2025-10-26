#!/bin/bash

echo "🚀 Starting CalorieCam Development Environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cat > .env << 'ENVEOF'
# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://192.168.3.6:3000

# Development
NODE_ENV=development
ENVEOF
    echo "✅ .env file created"
fi

# Start API server
echo "🔧 Starting API server..."
cd apps/api
npm run start:dev &
API_PID=$!

# Wait for API to start
echo "⏳ Waiting for API to start..."
sleep 5

# Start Expo development server
echo "📱 Starting Expo development server..."
cd ../..
npm start

# Cleanup on exit
trap "kill $API_PID" EXIT
