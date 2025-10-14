#!/bin/bash

if [[ "$OSTYPE" == "msys" ]]; then
    .venv\Scripts\activate
else
    source .venv/bin/activate
fi

# Kill any processes using port 8000 (Django's default port)
PORT_NUMBER=8000
lsof -i tcp:${PORT_NUMBER} | awk 'NR!=1 {print $2}' | xargs kill

cd backend || exit
python manage.py runserver &

cd ..

cd frontend && npm run dev