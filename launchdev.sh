#!/bin/bash

if [[ "$OSTYPE" == "msys" ]]; then
    .venv\Scripts\activate
else
    source .venv/bin/activate
fi

./killdjango.sh

cd backend || exit
python manage.py runserver &

cd ..

cd frontend && npm run dev