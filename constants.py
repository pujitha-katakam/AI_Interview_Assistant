import os

# ============================
# API Keys
# ============================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # must be set in Railway

# ============================
# Application Settings
# ============================
APP_HOST = "0.0.0.0"
APP_PORT = int(os.getenv("PORT", 8000))
APP_TITLE = "Interview Assistant API"
APP_VERSION = "1.0.0"

# ============================
# CORS Settings
# ============================
ALLOWED_ORIGINS = ["*"]

# ============================
# Question Generation Settings
# ============================
DEFAULT_ROLE = "fullstack"
DEFAULT_COUNTS = {"easy": 2, "medium": 2, "hard": 2}
DEFAULT_SEED = 42

# ============================
# Scoring Settings
# ============================
DIFFICULTY_WEIGHTS = {"easy": 1.0, "medium": 1.75, "hard": 2.25}

# ============================
# File Processing Settings
# ============================
MAX_FILE_SIZE = 10 * 1024 * 1024
SUPPORTED_FILE_TYPES = ["pdf", "docx"]
MAX_TEXT_LENGTH = 5000
