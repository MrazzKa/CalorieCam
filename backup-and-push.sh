#!/bin/bash

# CalorieCam Backup and GitHub Push Script
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 Creating backup...${NC}"

# Get current date
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_NAME="caloriecam-backup-${TIMESTAMP}.tar.gz"

# Cleanup old backups first
echo -e "${YELLOW}Cleaning old backups...${NC}"
rm -f caloriecam-backup-*.tar.gz

# Create backup in root directory (excluding unnecessary files)
echo -e "${YELLOW}Creating archive...${NC}"
tar -czf "$BACKUP_NAME" \
  --exclude='node_modules' \
  --exclude='.expo' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='*.tar.gz' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='apps/api/.env' \
  --exclude='apps/api/dist' \
  --exclude='apps/api/node_modules' \
  --exclude='apps/api/.cache' \
  --exclude='public' \
  --exclude='coverage' \
  --exclude='.next' \
  --exclude='.nuxt' \
  --exclude='.cache' \
  --exclude='temp' \
  --exclude='tmp' \
  .

echo -e "${GREEN}✅ Backup created: $BACKUP_NAME${NC}"
echo -e "${BLUE}📊 Backup size: $(du -h "$BACKUP_NAME" | cut -f1)${NC}"

# Show backup location
echo -e "${YELLOW}📁 Backup location: $(pwd)/$BACKUP_NAME${NC}"

echo ""
echo -e "${BLUE}🚀 Preparing to push to GitHub...${NC}"

# Check git status
if ! git status &>/dev/null; then
    echo -e "${YELLOW}⚠️  Not a git repository. Initializing...${NC}"
    git init
    git remote add origin https://github.com/MrazzKa/CalorieCam.git || true
fi

# Add all changes
echo -e "${YELLOW}📝 Adding files to git...${NC}"
git add .

# Check if there are changes
if git diff --staged --quiet; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
else
    # Commit changes
    echo -e "${YELLOW}💾 Committing changes...${NC}"
    git commit -m "Update: $(date +'%Y-%m-%d %H:%M:%S')" || {
        echo -e "${YELLOW}ℹ️  No new changes to commit${NC}"
    }
fi

# Push to GitHub
echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
echo -e "${YELLOW}Current branch: $(git branch --show-current)${NC}"

# Ask for confirmation
read -p "Push to GitHub? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main || git push origin master || {
        echo -e "${YELLOW}⚠️  Push failed. Trying to set upstream...${NC}"
        git push -u origin main || git push -u origin master
    }
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
else
    echo -e "${YELLOW}⚠️  Push cancelled${NC}"
fi

echo ""
echo -e "${GREEN}✅ Done!${NC}"
echo -e "${BLUE}📦 Backup: $BACKUP_NAME${NC}"
echo -e "${BLUE}🌐 GitHub: https://github.com/MrazzKa/CalorieCam${NC}"

