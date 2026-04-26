#!/usr/bin/env bash
set -e

PROJECT_DIR="workspace/projects/megapot-agent"
REQUIRED_FILES=(
  "package.json"
  "package-lock.json"
  "tsconfig.json"
  "src/cli.ts"
  "src/config.ts"
  "src/contracts.ts"
  "src/megapot.ts"
  "src/reporting.ts"
  "src/state.ts"
)

echo "Checking Lottery Agent helper project..."

missing=()
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$PROJECT_DIR/$file" ]; then
    missing+=("$PROJECT_DIR/$file")
  fi
done

if [ "${#missing[@]}" -gt 0 ]; then
  echo "Lottery Agent helper project is incomplete. Missing files:"
  printf ' - %s\n' "${missing[@]}"
  exit 1
fi

cd "$PROJECT_DIR"

echo "Installing Lottery Agent helper dependencies..."
npm ci --include=dev

echo "Building Lottery Agent helper..."
rm -rf dist
npm run build

if [ ! -f "dist/cli.js" ]; then
  echo "Build completed but dist/cli.js was not created."
  exit 1
fi

echo ""
echo "Setup complete. Open the chat to configure your Megapot lottery agent."
