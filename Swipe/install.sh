#!/bin/bash

# Interview Assistant - Installation Script
# This script sets up the Interview Assistant application

set -e  # Exit on any error

echo "🚀 Setting up Interview Assistant..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create virtual environment for Python
echo "📦 Setting up Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📥 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Install Node.js dependencies
echo "📥 Installing Node.js dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please edit .env file and add your OpenAI API key"
fi

echo "✅ Installation completed successfully!"
echo ""
echo "🎯 To start the application:"
echo "   ./start.sh"
echo ""
echo "🔧 To activate the Python virtual environment manually:"
echo "   source venv/bin/activate"
echo ""
echo "📖 For detailed setup instructions, see SETUP_GUIDE.md"
