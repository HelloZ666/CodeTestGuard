# ========== Stage 1: Build Frontend ==========
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# ========== Stage 2: Python Backend ==========
FROM python:3.11-slim AS backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy API code
COPY api/ ./api/

# Set Python path
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# Start uvicorn
CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "8000"]
