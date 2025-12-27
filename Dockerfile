FROM node:20-bullseye AS frontend_build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim AS runtime
WORKDIR /app

# backend
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt
COPY backend/ /app/backend/

# frontend dist
COPY --from=frontend_build /app/frontend/dist /app/frontend_dist

# simple static serving via fastapi
RUN pip install --no-cache-dir starlette==0.38.5

ENV PORT=7860

# Start FastAPI + serve frontend dist
CMD ["bash", "-lc", "python -c \"\
import os; \
from fastapi import FastAPI; \
from fastapi.staticfiles import StaticFiles; \
from backend.main import app as api; \
app = FastAPI(); \
app.mount('/api', api); \
app.mount('/', StaticFiles(directory='/app/frontend_dist', html=True), name='static'); \
import uvicorn; \
uvicorn.run(app, host='0.0.0.0', port=int(os.environ.get('PORT','7860'))); \
\""]
