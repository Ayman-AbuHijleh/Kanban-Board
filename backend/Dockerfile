# ===========================
# Build stage
# ===========================
FROM python:3.10 AS builder

WORKDIR /app


COPY requirements.txt .


RUN apt-get update && apt-get install -y build-essential curl


RUN pip install --prefix=/install --no-cache-dir -r requirements.txt


COPY . .

# ===========================
# Production stage
# ===========================
FROM python:3.10-slim AS production

WORKDIR /app

COPY --from=builder /install /usr/local


COPY --from=builder /app .


ENV PORT=5000


EXPOSE 5000

# Use eventlet worker for WebSocket support
# -w 1: Single worker (required for WebSocket state consistency)
# --worker-class eventlet: Enables WebSocket support
# --timeout 120: Longer timeout for WebSocket connections
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:5000", "--timeout", "120", "wsgi:app"]

