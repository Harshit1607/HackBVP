import os
from dotenv import load_dotenv

load_dotenv()

# Server Settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "info")

# Sensing settings
FPS = int(os.getenv("FPS", "20"))
N_SUBCARRIERS = int(os.getenv("N_SUBCARRIERS", "56"))

# Simulation defaults
BREATHING_BPM = float(os.getenv("BREATHING_BPM", "15"))
HEART_RATE_BPM = float(os.getenv("HEART_RATE_BPM", "68"))
NOISE_STD = float(os.getenv("NOISE_STD", "0.05"))

# Storage settings
RECORDINGS_DIR = os.getenv("RECORDINGS_DIR", "data/recordings")
AUTO_RECORD = os.getenv("AUTO_RECORD", "true").lower() == "true"
MAX_RECORDING_SIZE_MB = int(os.getenv("MAX_RECORDING_SIZE_MB", "100"))

# Replay constraints
REPLAY_SPEED_MIN = float(os.getenv("REPLAY_SPEED_MIN", "0.25"))
REPLAY_SPEED_MAX = float(os.getenv("REPLAY_SPEED_MAX", "4.0"))

# Ensure recordings directory exists
os.makedirs(RECORDINGS_DIR, exist_ok=True)
