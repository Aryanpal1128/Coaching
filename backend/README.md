# Production-Ready MERN Backend for AI-Powered Student Learning Platform

A modular, highly scalable, and production-ready Express.js + MongoDB backend powering an AI-assisted educational Q&A platform, live learning sessions, dynamic gamified leaderboards, and real-time socket notifications.

---

## 🚀 Key Features & Highlights

- **3 Role-Based Authorization (RBAC)**: Student, Teacher, Admin.
- **JWT Authentication & Security**: Secure Access & Refresh Tokens, bcrypt hashing, Helmet HTTP headers, CORS configuration, rate limiting, and Zod input validation.
- **Gemini / OpenAI AI Answer Evaluation Engine**: Automated AI grading returning Accuracy Score (0-100), Concept Coverage, Missing Points, Grammar Score, Feedback, Confidence, and Summary upon every answer submission.
- **Intelligent Dynamic Answer Ranking Formula**:
  $$\text{Final Score} = (\text{Accuracy} \times 0.45) + (\text{Upvotes} \times 0.20) + (\text{Reputation} \times 0.15) + (\text{Speed} \times 0.10) + (\text{Teacher Endorsement} \times 0.10) - (\text{Reports} \times 0.15)$$
- **Reputation & Tier Level System**: Earn points for accepted answers (+20), high AI accuracy (>90% score -> +15), upvotes (+5), daily logins (+2), teacher endorsements (+10); auto progression across 5 levels: Beginner, Learner, Contributor, Expert, and Master.
- **Real-Time Live Classes & Notifications via Socket.IO**: Live class rooms with real-time chat, screen sharing signals, attendance logging, and instant notification pushes.
- **Full-Text Q&A Search & Filters**: Search questions by keyword, tags, subjects, difficulty, teacher, or popularity.
- **Admin Management Panel**: Account suspension/deletion, content moderation report resolution, subject creation, badge assignment, and platform activity analytics.

---

## 📁 Directory Structure

```
coaching/
├── server.js                  # Entry point bootstrapping HTTP & Socket.IO server
├── package.json               # ES Modules & dependency configuration
├── .env.example               # Environment variable template
├── postman_collection.json    # Ready-to-import Postman REST API collection
├── public/uploads/            # File & media storage directory
└── src/
    ├── app.js                 # Express app setup, security, middlewares & routing
    ├── config/                # Database (Mongoose), Logger (Winston), Sockets
    ├── constants/             # Roles, Reputation events, Level thresholds
    ├── models/                # 19 Mongoose Schemas & Models
    ├── middlewares/           # Auth, RBAC, Zod Validate, Multer Upload, Rate Limit, Error Handler
    ├── validators/            # Zod validation schemas
    ├── services/              # Business logic (Auth, AI Eval, Ranking, Reputation, Q&A, Admin, etc.)
    ├── controllers/           # HTTP Request & Response handlers
    ├── routes/                # Express API REST endpoints
    ├── sockets/               # Socket.IO handlers for Live Classes and Notifications
    └── utils/                 # ApiError, ApiResponse, asyncHandler, token, seed
```

---

## ⚙️ Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. **Seed Database (Optional for local testing)**:
   Populate MongoDB with sample Admin, Teacher, Student, Subject, Badges, Questions, and AI-evaluated answers:
   ```bash
   npm run seed
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## 📡 API Endpoint Overview

### 🔑 Authentication (`/api/v1/auth`)
- `POST /register` - Register Student, Teacher, or Admin
- `GET /verify-email?token=...` - Verify Email address
- `POST /login` - User login and JWT issue
- `POST /refresh-token` - Refresh access token
- `POST /logout` - Logout session
- `POST /forgot-password` - Trigger reset email
- `POST /reset-password` - Reset password
- `POST /change-password` - Change existing password
- `GET /me` - Get current logged-in profile

### ❓ Question System (`/api/v1/questions`)
- `POST /` - Ask a question
- `GET /search` - Search & filter questions (by query, tag, subject, difficulty, popularity)
- `GET /:id` - Get question details
- `PUT /:id` - Edit question (Author only)
- `DELETE /:id` - Delete question (Author or Admin)
- `POST /:id/follow` - Follow / unfollow question
- `POST /:id/bookmark` - Bookmark question

### 💡 Answer System & AI Evaluation (`/api/v1/answers`)
- `POST /` - Submit answer (triggers Gemini AI evaluation & calculates ranking)
- `GET /question/:questionId` - Get ranked answers for a question
- `POST /:id/vote` - Upvote or Downvote answer
- `POST /:id/accept` - Mark answer as accepted (Question author only)
- `POST /:id/endorse` - Endorse answer (Teacher / Admin only)
- `POST /:id/comments` - Comment on an answer
- `POST /comments/:commentId/replies` - Reply to a comment

### 🏆 Leaderboards (`/api/v1/leaderboard`)
- `GET /overall` - Overall reputation leaderboard
- `GET /weekly` - Weekly reputation leaderboard
- `GET /monthly` - Monthly reputation leaderboard
- `GET /subject/:subjectId` - Subject-specific answer rankers

### 👩‍🏫 Teacher & Live Classes (`/api/v1/teacher` & `/api/v1/live-classes`)
- `POST /teacher/materials` - Upload study material
- `POST /teacher/notes` - Create notes
- `POST /teacher/assignments` - Post assignment
- `POST /live-classes/schedule` - Schedule a live class session
- `PUT /live-classes/:id/start` - Start live class & send real-time notification
- `POST /live-classes/:id/attendance` - Record student attendance

### 🔔 Notifications (`/api/v1/notifications`)
- `GET /` - Fetch user notifications
- `PUT /:id/read` - Mark notification as read

### 🛡️ Admin Panel (`/api/v1/admin`)
- `PUT /users/:userId/suspension` - Suspend or reactivate user account
- `DELETE /users/:userId` - Delete user account
- `GET /reports` - List flagged content reports
- `PUT /reports/:id/resolve` - Resolve report (with option to delete content)
- `POST /subjects` - Add new academic subject
- `POST /badges` - Create system badge
- `GET /analytics` - Get platform statistics dashboard

---

## ⚡ Socket.IO Live Events

Connect to Socket.IO at `ws://localhost:5000`:
- **Personal Notifications Channel**: Emit `join_user_room(userId)` to receive `new_notification` events.
- **Live Class Room**: Emit `join_live_class({ classId, user })` to send/receive live chat messages via `send_class_chat` and screen sharing status updates via `screen_share_status`.

---

## 🧪 Postman Testing

Import the included `postman_collection.json` into Postman to test all API endpoints with sample body payloads and authorization headers.
