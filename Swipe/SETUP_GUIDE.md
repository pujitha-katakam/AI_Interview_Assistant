# Interview Assistant - Setup Guide

This guide will help you set up the Interview Assistant application on any system.

## Prerequisites

### System Requirements
- **Python**: 3.8 or higher
- **Node.js**: 16.0 or higher  
- **npm**: 8.0 or higher
- **Git**: For cloning the repository

### Operating System Support
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu 18.04+, CentOS 7+)

## Quick Start

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd Swipe
```

### 2. Backend Setup (Python)

#### Install Python Dependencies
```bash
# Install base requirements
pip install -r requirements.txt

# For development (optional)
pip install -r requirements-dev.txt
```

#### Environment Configuration
1. Copy the environment template:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` file and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your-actual-openai-api-key-here
   ```

### 3. Frontend Setup (Node.js)

#### Install Node.js Dependencies
```bash
npm install
```

### 4. Run the Application

#### Option A: Run Both Services (Recommended)
```bash
# Windows
start.bat

# Linux/macOS
npm run dev:full
```

#### Option B: Run Services Separately

**Terminal 1 - Backend:**
```bash
python Assistant.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Detailed Setup Instructions

### Python Environment Setup

#### Using Virtual Environment (Recommended)
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Using Conda (Alternative)
```bash
# Create conda environment
conda create -n interview-assistant python=3.9
conda activate interview-assistant

# Install dependencies
pip install -r requirements.txt
```

### Node.js Environment Setup

#### Using nvm (Node Version Manager)
```bash
# Install nvm (if not already installed)
# Windows: https://github.com/coreybutler/nvm-windows
# Linux/macOS: https://github.com/nvm-sh/nvm

# Install and use Node.js 18
nvm install 18
nvm use 18

# Install dependencies
npm install
```

## Configuration

### Backend Configuration (`constants.py`)
```python
# API Configuration
OPENAI_API_KEY = "your-openai-api-key-here"

# Application Settings
APP_HOST = "0.0.0.0"  # Change to "127.0.0.1" for localhost only
APP_PORT = 8000

# CORS Settings
ALLOWED_ORIGINS = ["*"]  # In production, specify your frontend domain
```

### Frontend Configuration (`.env`)
```bash
# Backend API URL
VITE_API_URL=http://localhost:8000

# OpenAI API Key (optional - for frontend features)
VITE_OPENAI_API_KEY=your-openai-api-key-here

# App Configuration
VITE_APP_TITLE=Interview Assistant
VITE_APP_VERSION=1.0.0
```

## Production Deployment

### Backend Deployment
```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker Assistant:app --bind 0.0.0.0:8000
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Serve static files (using nginx, Apache, or any static file server)
# Files will be in the 'dist' directory
```

## Troubleshooting

### Common Issues

#### 1. Python Dependencies Issues
```bash
# If you encounter permission errors
pip install --user -r requirements.txt

# If you have multiple Python versions
python3 -m pip install -r requirements.txt
```

#### 2. Node.js Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. Port Already in Use
```bash
# Find process using port 8000
# Windows:
netstat -ano | findstr :8000
# Linux/macOS:
lsof -i :8000

# Kill the process or change the port in constants.py
```

#### 4. OpenAI API Issues
- Ensure your API key is valid and has sufficient credits
- Check your internet connection
- Verify the API key is correctly set in `constants.py`

#### 5. File Upload Issues
- Ensure the file is in PDF or DOCX format
- Check file size (max 10MB)
- Verify file is not corrupted

### Platform-Specific Notes

#### Windows
- Use PowerShell or Command Prompt as Administrator if needed
- Ensure Python and Node.js are in your PATH
- Consider using Windows Subsystem for Linux (WSL) for better compatibility

#### macOS
- You may need to install Xcode Command Line Tools: `xcode-select --install`
- Use Homebrew for easier package management: `brew install python node`

#### Linux
- Install build essentials: `sudo apt-get install build-essential`
- For Ubuntu/Debian: `sudo apt-get install python3-dev python3-pip nodejs npm`
- For CentOS/RHEL: `sudo yum install python3-devel python3-pip nodejs npm`

## Development

### Code Quality
```bash
# Format Python code
black Assistant.py constants.py

# Lint Python code
flake8 Assistant.py constants.py

# Type checking
mypy Assistant.py constants.py
```

### Testing
```bash
# Run Python tests
pytest

# Run with coverage
pytest --cov=.

# Run frontend tests
npm test
```

## Support

If you encounter any issues:
1. Check this troubleshooting guide
2. Verify all dependencies are installed correctly
3. Check the console logs for error messages
4. Ensure your OpenAI API key is valid and has credits

## API Endpoints

The backend provides the following endpoints:
- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /parse-resume` - Parse uploaded resume files
- `POST /generate-questions` - Generate interview questions
- `POST /score-answer` - Score candidate answers
- `POST /finalize` - Generate final interview summary
- `POST /test-openai` - Test OpenAI API connection

## File Structure
```
Swipe/
├── Assistant.py              # Main FastAPI application
├── constants.py              # Configuration constants
├── requirements.txt          # Python dependencies
├── requirements-dev.txt      # Development dependencies
├── package.json              # Node.js dependencies
├── src/                      # Frontend React application
├── dist/                     # Built frontend files
└── SETUP_GUIDE.md           # This file
```
