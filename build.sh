#!/usr/bin/env bash
set -o errexit

echo "==> Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "==> Building React frontend..."
cd frontend
npm install
npm run build
cd ..

echo "==> Collecting static files..."
cd backend
python manage.py collectstatic --no-input

echo "==> Running migrations..."
python manage.py migrate

echo "==> Build complete!"
