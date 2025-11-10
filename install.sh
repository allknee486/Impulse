#!/bin/bash
# Script for automatically installing dependencies for backend and frontend and setting up Django project for run

if [[ "$OSTYPE" == "msys" ]]; then
    .venv\Scripts\activate
else
    source .venv/bin/activate
fi

cd backend || exit

pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
yes yes | python manage.py collectstatic > /dev/null

cd ..

cd frontend || exit

npm install > /dev/null