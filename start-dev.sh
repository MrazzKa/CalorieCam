#!/bin/bash

echo "🚀 Starting EatSense Development Environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cat > .env << 'ENVEOF'
# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://172.20.10.2:3000

# Development
NODE_ENV=development
ENVEOF
    echo "✅ .env file created"
fi

# Start API server
echo "🔧 Starting API server..."
cd apps/api

# Check if we have the full API setup
if [ -f "package.json" ] && grep -q "nest" package.json; then
    echo "📦 Starting full NestJS API..."
    npm run start:dev &
    API_PID=$!
else
    echo "🧪 Starting test API server..."
    node test-api.js &
    API_PID=$!
fi

# Wait for API to start
echo "⏳ Waiting for API to start..."
sleep 3

# Start Expo development server
echo "📱 Starting Expo development server..."
cd ../..
export EXPO_PUBLIC_API_BASE_URL="http://172.20.10.2:3000"
export REACT_NATIVE_PACKAGER_HOSTNAME="172.20.10.2"
npm run start:dev

# Cleanup on exit
trap "kill $API_PID" EXIT
