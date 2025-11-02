#!/bin/bash

echo "🔍 Checking CalorieCam Services..."

# Check if API is running
if curl -s http://172.20.10.2:3000/v1/health > /dev/null; then
    echo "✅ API server is running"
else
    echo "❌ API server is not running"
fi

# Check if Expo is running
if pgrep -f "expo start" > /dev/null; then
    echo "✅ Expo development server is running"
else
    echo "❌ Expo development server is not running"
fi

# Check if Metro is running
if pgrep -f "metro" > /dev/null; then
    echo "✅ Metro bundler is running"
else
    echo "❌ Metro bundler is not running"
fi

echo "🔍 Service check complete"
