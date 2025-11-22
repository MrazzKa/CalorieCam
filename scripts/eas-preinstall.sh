#!/usr/bin/env bash
set -euxo pipefail

# Enable corepack to manage pnpm version
corepack enable

# Activate the exact pnpm version specified in package.json (10.19.0)
corepack prepare pnpm@10.19.0 --activate

# Verify pnpm version
pnpm --version

echo "✅ pnpm version $(pnpm --version) activated successfully"

