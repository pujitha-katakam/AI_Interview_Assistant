@echo off
REM Interview Assistant - Windows Installation Script
REM This script sets up the Interview Assistant application on Windows

echo 🚀 Setting up Interview Assistant...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16 or higher.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Create virtual environment for Python
echo 📦 Setting up Python virtual environment...
python -m venv venv

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install Python dependencies
echo 📥 Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Install Node.js dependencies
echo 📥 Installing Node.js dependencies...
npm install

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    copy env.example .env
    echo ⚠️  Please edit .env file and add your OpenAI API key
)

echo ✅ Installation completed successfully!
echo.
echo 🎯 To start the application:
echo    start.bat
echo.
echo 🔧 To activate the Python virtual environment manually:
echo    venv\Scripts\activate.bat
echo.
echo 📖 For detailed setup instructions, see SETUP_GUIDE.md
pause
