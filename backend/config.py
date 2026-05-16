"""
Backend configuration and startup
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "info")

# API Configuration
API_TITLE = "AI Singing Tutor API"
API_VERSION = "0.1.0"
API_DESCRIPTION = "Real-time AI singing analysis and feedback system"

# CORS Configuration
CORS_ORIGINS = ["*"]  # Allow all origins for development
CORS_CREDENTIALS = True
CORS_METHODS = ["*"]
CORS_HEADERS = ["*"]

# Server Configuration
HOST = "0.0.0.0"
PORT = 8000
RELOAD = DEBUG

# WebSocket Configuration
WS_HEARTBEAT = 10  # seconds
WS_TIMEOUT = 30  # seconds
import logging

# Configure root logging based on env var
try:
	logging.basicConfig(level=LOG_LEVEL.upper())
except Exception:
	logging.basicConfig(level="INFO")

logger = logging.getLogger(__name__)
logger.info("[CONFIG] Environment: %s", ENVIRONMENT)
logger.info("[CONFIG] Debug: %s", DEBUG)
logger.info("[CONFIG] Log Level: %s", LOG_LEVEL)
