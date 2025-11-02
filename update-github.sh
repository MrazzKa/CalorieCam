#!/bin/bash

# Simple GitHub update script
set -e

echo "🚀 Updating GitHub repository..."

# Check git status
if ! git status &>/dev/null; then
    echo "⚠️  Not a git repository. Initializing..."
    git init
    git remote add origin https://github.com/MrazzKa/CalorieCam.git || true
fi

# Add all changes
echo "📝 Adding files..."
git add .

# Check if there are changes
if git diff --staged --quiet; then
    echo "⚠️  No changes to commit"
    exit 0
fi

# Show what will be committed
echo ""
echo "📋 Files to be committed:"
git diff --staged --stat

echo ""
read -p "Commit and push to GitHub? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Commit
    echo "💾 Committing..."
    git commit -m "Update: $(date +'%Y-%m-%d %H:%M:%S')"
    
    # Push
    echo "📤 Pushing to GitHub..."
    git push origin main || git push origin master || {
        echo "⚠️  Push failed. Setting upstream..."
        git push -u origin main || git push -u origin master
    }
    
    echo "✅ Successfully pushed to GitHub!"
    echo "🌐 https://github.com/MrazzKa/CalorieCam"
else
    echo "⚠️  Cancelled"
fi

