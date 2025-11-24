#!/bin/bash
# Backup script for EatSense project
# Creates a backup with git commit + archive

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$HOME/backups/eatsense"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="eatsense_backup_${TIMESTAMP}.tar.gz"

echo "🔄 Starting backup process..."
echo "📁 Project directory: $PROJECT_DIR"
echo "💾 Backup directory: $BACKUP_DIR"
echo "📦 Archive name: $ARCHIVE_NAME"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Navigate to project directory
cd "$PROJECT_DIR"

# Step 1: Check git status and commit if there are changes
echo ""
echo "📝 Step 1: Checking git status..."

if [ -d .git ]; then
  # Check if there are uncommitted changes
  if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Uncommitted changes found. Creating backup commit..."
    
    # Add all changes
    git add -A
    
    # Create commit with timestamp
    git commit -m "backup: snapshot before changes $(date +%Y-%m-%d_%H:%M:%S)" || {
      echo "⚠️  Failed to create git commit (may be no changes or commit error)"
    }
    
    # Push if remote exists
    if git remote | grep -q .; then
      echo "📤 Pushing to remote repository..."
      git push || echo "⚠️  Failed to push to remote (may not be configured)"
    fi
    
    echo "✅ Git commit created"
  else
    echo "✅ No uncommitted changes"
  fi
  
  # Show current commit hash
  COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
  echo "📍 Current commit: $COMMIT_HASH"
else
  echo "⚠️  Not a git repository, skipping git operations"
fi

# Step 2: Create archive excluding unnecessary files
echo ""
echo "📦 Step 2: Creating archive..."

# Files/directories to exclude from backup
EXCLUDE_LIST=(
  "node_modules"
  ".expo"
  "dist"
  "build"
  "coverage"
  ".next"
  "ios/build"
  "android/build"
  "android/app/build"
  "*.log"
  ".DS_Store"
  ".cache"
  ".pnpm-store"
  ".yarn"
  ".pnp"
  "*.tsbuildinfo"
)

# Build exclude arguments for tar
EXCLUDE_ARGS=""
for item in "${EXCLUDE_LIST[@]}"; do
  EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude=$item"
done

# Create archive
tar -czf "$BACKUP_DIR/$ARCHIVE_NAME" \
  $EXCLUDE_ARGS \
  --exclude-vcs-ignores \
  --exclude='*.swp' \
  --exclude='*.swo' \
  --exclude='*~' \
  --exclude='backup.sh' \
  --exclude='backup_*.tar.gz' \
  -C "$PROJECT_DIR" \
  .

# Calculate archive size
ARCHIVE_SIZE=$(du -h "$BACKUP_DIR/$ARCHIVE_NAME" | cut -f1)

echo "✅ Archive created: $BACKUP_DIR/$ARCHIVE_NAME"
echo "📊 Archive size: $ARCHIVE_SIZE"

# Step 3: Create info file
INFO_FILE="$BACKUP_DIR/backup_info_${TIMESTAMP}.txt"
cat > "$INFO_FILE" << EOF
EatSense Backup Information
===========================

Timestamp: $(date '+%Y-%m-%d %H:%M:%S')
Archive: $ARCHIVE_NAME
Size: $ARCHIVE_SIZE
Project Directory: $PROJECT_DIR
Git Commit: ${COMMIT_HASH:-not available}

Files included:
- All source code
- Configuration files
- Documentation

Files excluded:
- node_modules/
- .expo/
- build artifacts
- cache files
- logs

To restore:
  tar -xzf $ARCHIVE_NAME -C /path/to/restore/location

EOF

echo ""
echo "✅ Backup completed successfully!"
echo ""
echo "📦 Archive location: $BACKUP_DIR/$ARCHIVE_NAME"
echo "📄 Info file: $INFO_FILE"
echo ""
echo "💡 Tip: Keep backups in a safe location (cloud storage, external drive)"

# Optional: List recent backups
echo ""
echo "📋 Recent backups in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -5 || echo "No previous backups found"

