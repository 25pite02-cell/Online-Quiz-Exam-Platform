# 🎯 Quiz Application - Full Stack (React + Node.js + MySQL)

## 📁 Project Structure
```
quiz-app/
├── database.sql          ← Import this in phpMyAdmin FIRST
├── backend/
│   ├── server.js         ← Main server file
│   ├── .env              ← Database config (edit this)
│   ├── config/db.js      ← MySQL connection
│   ├── middleware/auth.js ← JWT authentication
│   └── routes/
│       ├── auth.js       ← Login / Register
│       ├── quiz.js       ← Quiz CRUD
│       └── attempt.js    ← Taking quizzes, scores
└── frontend/
    └── src/
        ├── App.js         ← Routes
        ├── api.js         ← All API calls
        ├── context/
        │   └── AuthContext.js
        ├── components/
        │   └── ProtectedRoute.js
        └── pages/
            ├── Login.js
            ├── Dashboard.js
            ├── TakeQuiz.js
            ├── Result.js
            ├── Leaderboard.js
            ├── AdminDashboard.js
            └── CreateQuiz.js
```

---

## 🚀 STEP-BY-STEP SETUP

### STEP 1 - Setup Database in phpMyAdmin
1. Open phpMyAdmin (usually http://localhost/phpmyadmin)
2. Click "Import" tab at the top
3. Choose the file: `database.sql`
4. Click "Go" to import
5. You should see `quiz_app` database created ✅

### STEP 2 - Setup Backend
Open a terminal/command prompt:
```bash
cd quiz-app/backend
npm install
```

Edit the `.env` file to match your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=        ← your MySQL password (empty if none)
DB_NAME=quiz_app
JWT_SECRET=any_random_long_string_here
PORT=5000
```

Start the backend:
```bash
npm run dev
```
You should see: `✅ Connected to MySQL database` and `🚀 Server running on http://localhost:5000`

### STEP 3 - Setup Frontend
Open a NEW terminal:
```bash
cd quiz-app/frontend
npm install
npm start
```
Browser opens at http://localhost:3000

---

## 🔑 Login Credentials
| Role  | Email              | Password |
|-------|--------------------|----------|
| Admin | admin@quiz.com     | admin123 |
| User  | john@example.com   | user123  |

---

## 📋 Features
- ✅ User Registration & Login (JWT Auth)
- ✅ Admin can Create/Edit/Delete Quizzes
- ✅ Add MCQ Questions with 4 options
- ✅ Timed Exam with live countdown timer
- ✅ Auto-submit when timer runs out
- ✅ Auto evaluation with instant score
- ✅ Detailed answer review after quiz
- ✅ Score history for each user
- ✅ Leaderboard per quiz
- ✅ Randomize question order option
- ✅ Admin dashboard with statistics
- ✅ Role-based access (Admin/User)

---

## 🌐 API Endpoints Reference

### Auth
- POST `/api/auth/register` - Register
- POST `/api/auth/login` - Login

### Quizzes
- GET `/api/quizzes` - Get active quizzes
- GET `/api/quizzes/all` - All quizzes (admin)
- POST `/api/quizzes` - Create quiz (admin)
- PUT `/api/quizzes/:id` - Update quiz (admin)
- DELETE `/api/quizzes/:id` - Delete quiz (admin)

### Attempts
- POST `/api/attempts/start` - Start quiz
- POST `/api/attempts/submit` - Submit answers
- GET `/api/attempts/my` - My results
- GET `/api/attempts/:id/result` - Detailed result
- GET `/api/attempts/leaderboard/:quizId` - Leaderboard
- GET `/api/attempts/admin/all` - All attempts (admin)
