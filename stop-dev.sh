#!/bin/bash

echo "🛑 Stopping CalorieCam Development Environment..."

# Kill all Node.js processes
pkill -f "node.*expo"
pkill -f "node.*nest"
pkill -f "node.*metro"

# Kill all npm processes
pkill -f "npm.*start"
pkill -f "npm.*dev"

echo "✅ All development processes stopped"
