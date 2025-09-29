#!/bin/bash

# Interview Assistant - Start Script
# This script starts both the backend and frontend services

set -e  # Exit on any error

echo "🚀 Starting Interview Assistant..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run ./install.sh first."
    exit 1
fi

# Activate virtual environment
echo "🔧 Activating Python virtual environment..."
source venv/bin/activate

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing Node.js dependencies..."
    npm install
fi

# Start both services
echo "🎯 Starting backend and frontend services..."
echo "   Backend: http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Start services concurrently
npm run dev:full
