FROM python:3.12-slim

RUN apt-get update -qq && apt-get install -y -qq unzip && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Free-tier containers are tiny; unlimited BLAS/OpenMP threads often triggers OOM/SIGSEGV (exit 139).
ENV OMP_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV NUMEXPR_NUM_THREADS=1

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and pre-downloaded model (from workflow)
COPY . .

# Unzip model if artifact uploaded it as a zip
RUN if [ -f models/model.zip ]; then \
      unzip -o models/model.zip -d models/ && rm models/model.zip; \
    fi && echo "Model ready in /app/models"

# Render (and other PaaS) inject PORT at runtime — must listen on it or you get 502.
EXPOSE 10000
CMD ["sh", "-c", "exec uvicorn app:app --host 0.0.0.0 --port ${PORT:-9696}"]
