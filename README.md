# AI-Powered Student & Teacher Knowledge Platform

A robust MERN stack application designed to facilitate learning, knowledge sharing, and AI-driven answer evaluation. 

## 🚀 Features

- **Authentication & RBAC**: Secure JWT-based authentication for Students, Teachers, and Admins.
- **AI Answer Evaluation**: Automated grading, feedback, and semantic scoring using Google Gemini (1.5 Flash).
- **Real-Time Communication**: Live Classes, Chat, and Notifications powered by Socket.io.
- **Dynamic Leaderboards**: Reputation scoring based on upvotes, AI accuracy, and endorsement.
- **Secure File Uploads**: Support for images and document attachments.
- **Optimized Performance**: Lazy loaded frontend, database indexing, and strict query validations.

## 🛠 Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Redux Toolkit, React Router v7, Socket.io-client.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io, Google Generative AI.
- **Security**: Helmet, Express Rate Limit, bcryptjs, JWT.

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB instance (local or Atlas)
- Google Gemini API Key

### 1. Clone & Install
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables
Create a `.env` file in the `backend` directory:
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/ai-coaching
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3. Run the Project
```bash
# Start backend (from /backend)
npm run dev

# Start frontend (from /frontend)
npm run dev
```

## 🔒 Security Measures Implemented
- HttpOnly Cookies for Refresh Tokens (Protects against XSS).
- Global and Auth-specific Rate Limiting (Protects against Brute Force).
- Zod schema validation for all API inputs (Protects against NoSQL injection and malformed data).
- Automated cascade deletions via Mongoose middleware.

## 📄 License
ISC License
