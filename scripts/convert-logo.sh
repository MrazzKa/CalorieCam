#!/bin/bash

# Script to convert SVG logo to PNG for splash screen
# Requires: ImageMagick or Inkscape

cd "$(dirname "$0")/.."

LOGO_SVG="assets/logo/Logo.svg"
LOGO_PNG="assets/logo/logo.png"

if [ ! -f "$LOGO_SVG" ]; then
  echo "❌ Error: $LOGO_SVG not found"
  exit 1
fi

echo "🔄 Converting SVG to PNG..."

# Try ImageMagick first
if command -v convert &> /dev/null; then
  echo "Using ImageMagick..."
  convert -background none -resize 2048x2048 "$LOGO_SVG" "$LOGO_PNG"
  echo "✅ Logo converted to $LOGO_PNG"
  exit 0
fi

# Try Inkscape
if command -v inkscape &> /dev/null; then
  echo "Using Inkscape..."
  inkscape --export-type=png --export-width=2048 --export-height=2048 --export-filename="$LOGO_PNG" "$LOGO_SVG"
  echo "✅ Logo converted to $LOGO_PNG"
  exit 0
fi

# Try Node.js with sharp (if available)
if command -v node &> /dev/null && [ -f "node_modules/.bin/svgr" ]; then
  echo "Using svgr..."
  # Fallback: suggest manual conversion
fi

echo "❌ Error: Neither ImageMagick nor Inkscape found."
echo ""
echo "Please install one of:"
echo "  - ImageMagick: apt-get install imagemagick (Linux) or brew install imagemagick (Mac)"
echo "  - Inkscape: apt-get install inkscape (Linux) or brew install inkscape (Mac)"
echo ""
echo "Or convert manually:"
echo "  1. Open $LOGO_SVG in any editor"
echo "  2. Export as PNG (2048x2048px)"
echo "  3. Save as $LOGO_PNG"
exit 1

