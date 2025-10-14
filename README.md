# Impulse

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn
- Git

---

## Backend Setup (Django)

### Step 1:  Create Virtual Environment and Navigate to Backend

```bash
python -m venv .venv

# On Windows
.venv\Scripts\activate
# On macOS/Linux
source .venv/bin/activate

cd backend
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 4: Create a Demo User (Optional)

```bash
python manage.py createsuperuser
```


### Step 6: Run Development Server

```bash
python manage.py runserver
```

Django will run on `http://localhost:8000`

---

## Frontend Setup (React)

### Step 1: Navigate to Frontend and Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Run Development Server

```bash
npm run dev
```

React will run on `http://localhost:5173` (or next available port)

---

## Testing the Application

### 1. Access the Frontend

Open browser to `http://localhost:5173`

### 2. Test Sign Up

1. Click "Sign up" link
2. Enter registration details:
   - Username: `testuser`
   - Email: `test@example.com`
   - First Name: `Test`
   - Last Name: `User`
   - Password: `testpass123`
   - Confirm Password: `testpass123`
3. Click "Sign Up"
4. Should redirect to dashboard

### 3. Test Login

1. Logout from dashboard
2. Click "Log in"
3. Enter credentials:
   - Username: `testuser`
   - Password: `testpass123`
4. Click "Log In"
5. Should redirect to dashboard

### 4. Test Token Refresh

1. Wait 1 hour (or manually edit JWT expiry time for testing)
2. Make an API call
3. Should automatically refresh token and continue working

### 5. Test CORS

Open browser console and verify no CORS errors appear

---

## API Documentation

### Authentication Endpoints

All endpoints require JWT token in header:

```
Authorization: Bearer <access_token>
```

#### Register User

```
POST /api/auth/register/

Request Body:
{
  "username": "string",
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "password": "string",
  "password_confirm": "string"
}

Response:
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string"
  },
  "tokens": {
    "access": "jwt_token",
    "refresh": "refresh_token"
  }
}
```

#### Login User

```
POST /api/auth/login/

Request Body:
{
  "username": "string",
  "password": "string"
}

Response:
{
  "message": "Login successful",
  "user": { ... },
  "tokens": { ... }
}
```

#### Get Current User

```
GET /api/auth/me/

Headers:
Authorization: Bearer <access_token>

Response:
{
  "id": 1,
  "username": "string",
  "email": "string",
  "first_name": "string",
  "last_name": "string"
}
```

#### Refresh Token

```
POST /api/auth/refresh/

Request Body:
{
  "refresh": "refresh_token"
}

Response:
{
  "access": "new_access_token"
}
```

#### Logout

```
POST /api/auth/logout/

Headers:
Authorization: Bearer <access_token>

Response:
{
  "message": "Logout successful"
}
```

---

## Project Structure

```
Impulse/
├── backend/
│   ├── api/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── manage.py
│   ├── requirements.txt
│   └── db.sqlite3
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── apiClient.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LogIn.jsx
│   │   │   ├── SignUp.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```