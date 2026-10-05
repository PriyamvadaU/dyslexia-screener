FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (ffmpeg, libsndfile)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

ENV SPEECH_SERVICE_HOST=0.0.0.0
ENV SPEECH_SERVICE_PORT=8000
ENV WHISPER_MODEL_SIZE=base.en
ENV WHISPER_DEVICE=cpu

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
