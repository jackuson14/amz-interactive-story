#!/bin/bash

# restart.sh - Kill old services and restart development server for testing
# Usage: ./restart.sh

# Change to the script directory (web folder)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔄 Restarting development server from $(pwd)..."

# Kill any existing Node.js processes running on port 3000
echo "🛑 Killing existing services..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No processes found on port 3000"

# Kill any npm/node processes that might be hanging
pkill -f "npm run dev" 2>/dev/null || echo "No npm dev processes found"
pkill -f "next dev" 2>/dev/null || echo "No next dev processes found"

# Wait a moment for processes to clean up
sleep 2

echo "📦 Installing dependencies..."
if npm install; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "🚀 Starting development server..."
echo "   Local:   http://localhost:3000"
echo "   Network: http://$(ipconfig getifaddr en0 2>/dev/null || hostname):3000"
echo ""
echo "Press Ctrl+C to stop the server"

# Start the development server
npm run dev