#!/bin/bash

# Cleanup script - removes unnecessary files before GitHub push

echo "🧹 Cleaning up unnecessary files..."

# Remove old backup files
echo "🗑️  Removing old backup files..."
rm -f caloriecam-backup-*.tar.gz

# Remove temporary files
echo "🗑️  Removing temporary files..."
find . -name "*.log" -type f -delete 2>/dev/null || true
find . -name ".DS_Store" -type f -delete 2>/dev/null || true

# Remove test artifacts
echo "🗑️  Cleaning test artifacts..."
rm -rf coverage 2>/dev/null || true
rm -rf .nyc_output 2>/dev/null || true

echo "✅ Cleanup complete!"

