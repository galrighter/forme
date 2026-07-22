# Vectorizer service — runs on the Hetzner box as a container.
# CPU-only; no GPU. opencv-python-headless needs no X libs, resvg-py ships its
# own Rust binary, so the runtime stays slim.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    JOB_STORAGE_DIR=/tmp/raster-to-svg

WORKDIR /app

# libgl/glib are pulled by some opencv builds; headless avoids most, keep libglib for safety
RUN apt-get update && apt-get install -y --no-install-recommends \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install .

COPY app ./app

EXPOSE 8000
CMD ["uvicorn", "app.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
