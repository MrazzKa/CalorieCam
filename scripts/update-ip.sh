#!/bin/bash
# Script to update IP address in package.json and .env
# Usage: ./scripts/update-ip.sh [IP_ADDRESS]

if [ -z "$1" ]; then
    echo "Usage: ./scripts/update-ip.sh <IP_ADDRESS>"
    echo "Example: ./scripts/update-ip.sh 192.168.3.6"
    exit 1
fi

IP=$1

echo "Updating IP address to: $IP"

# Update package.json
if [ -f "package.json" ]; then
    # For Windows/WSL, use PowerShell-compatible sed or direct replacement
    if command -v sed &> /dev/null; then
        sed -i "s/REACT_NATIVE_PACKAGER_HOSTNAME=[0-9.]*/REACT_NATIVE_PACKAGER_HOSTNAME=$IP/g" package.json
        echo "✅ Updated package.json"
    else
        echo "⚠️  sed not found, please update package.json manually:"
        echo "   Change REACT_NATIVE_PACKAGER_HOSTNAME to $IP"
    fi
fi

# Update .env if it exists and doesn't use ngrok
if [ -f ".env" ]; then
    if grep -q "ngrok" .env; then
        echo "ℹ️  .env uses ngrok, no need to update API URL"
    else
        if command -v sed &> /dev/null; then
            sed -i "s|EXPO_PUBLIC_API_BASE_URL=http://[0-9.]*:3000|EXPO_PUBLIC_API_BASE_URL=http://$IP:3000|g" .env
            echo "✅ Updated .env"
        else
            echo "⚠️  sed not found, please update .env manually:"
            echo "   Change EXPO_PUBLIC_API_BASE_URL to http://$IP:3000"
        fi
    fi
fi

echo "Done! Restart Expo with: npm run start:lan"

