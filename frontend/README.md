# Edu-Track

Edu-Track is a comprehensive university management platform for handling courses, programs, faculties, lectures, attendance, and user management.  
It features a modern React frontend and a Django backend with REST APIs.

## Features

- User authentication and role-based access
- Course and program management
- Faculty and department management
- Lecture scheduling
- Attendance tracking (QR code support)
- Academic progress overview
- Responsive dashboard for students, faculty, and admins

## Project Structure

```
backend/    # Django backend (API, models, admin, etc.)
frontend/   # React frontend (UI, services, assets)
media/      # Uploaded files and images
```

## Getting Started

### Backend

1. **Install dependencies:**
   ```sh
   cd backend
   pip install -r requirements.txt
   ```
2. **Run migrations:**
   ```sh
   python manage.py migrate
   ```
3. **Start the server:**
   ```sh
   python manage.py runserver
   ```

### Frontend

1. **Install dependencies:**
   ```sh
   cd frontend
   npm install
   ```
2. **Start the development server:**
   ```sh
   npm run dev
   ```

## Environment Variables

- Backend: `backend/.env`
- Frontend: `frontend/.env`

## Documentation

See [docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md) for detailed module and API documentation.

## License

MIT License
