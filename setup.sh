#!/usr/bin/env bash
set -e

cd workspace/projects/megapot-agent

echo "Installing Lottery Agent helper dependencies..."
npm install --include=dev

echo "Building Lottery Agent helper..."
npm run build

echo ""
echo "Setup complete. Open the chat to configure your Megapot lottery agent."
