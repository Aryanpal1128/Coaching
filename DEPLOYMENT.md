# AI Coaching Platform — Deployment Guide

## Architecture

| Layer | Service | URL pattern |
|-------|---------|------------|
| Frontend | Vercel | `https://your-app.vercel.app` |
| Backend | Render (Web Service) | `https://your-backend.onrender.com` |
| Database | MongoDB Atlas | Cloud-hosted |
| File Storage | Cloudinary | Cloud-hosted |
| AI | Google Gemini API | Cloud-hosted |

---

## 1 · MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) → Create a free cluster
2. **Database Access** → Add a database user with password
3. **Network Access** → Add IP `0.0.0.0/0` (allow all — required for Render's dynamic IPs)
4. **Connect** → Choose "Connect your application" → copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```

---

## 2 · Render (Backend) Deployment

### Step 1 — Create a Web Service
1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repository
3. Set the root directory to `backend`
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** `Node`

### Step 2 — Set Environment Variables on Render

Go to your Web Service → **Environment** tab and add all variables below:

```
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app

MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/<db>?retryWrites=true&w=majority

JWT_ACCESS_SECRET=<generate: openssl rand -base64 64>
JWT_REFRESH_SECRET=<generate: openssl rand -base64 64>
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
JWT_VERIFY_EMAIL_EXPIRATION=24h
JWT_RESET_PASSWORD_EXPIRATION=1h

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM="AI Learning Platform <noreply@ailearning.com>"

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GEMINI_API_KEY=your_gemini_api_key
```

> **Important:** Generate strong JWT secrets using:
> ```bash
> openssl rand -base64 64
> ```

> **Important:** For Gmail, use an **App Password** (not your account password).
> Google Account → Security → 2-Step Verification → App Passwords

### Step 3 — Note your Render URL
After deployment, note your backend URL: `https://your-backend.onrender.com`

---

## 3 · Vercel (Frontend) Deployment

### Step 1 — Create a Project
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Set the root directory to `frontend`
4. Framework preset: **Vite**

### Step 2 — Set Environment Variables on Vercel

Go to your project → **Settings** → **Environment Variables**:

```
VITE_API_URL=https://your-backend.onrender.com/api/v1
```

> Include `/api/v1` at the end of the URL. This is the API base path.

### Step 3 — Deploy
Vercel will automatically run `vite build` and deploy.

The `vercel.json` in the frontend folder handles SPA routing — all paths are rewritten to `index.html`.

---

## 4 · After Deployment Checklist

### Backend Health Check
```bash
curl https://your-backend.onrender.com/health
# Expected: {"status":"OK","uptime":...,"timestamp":...}
```

### Test API Endpoints
```bash
# Register
curl -X POST https://your-backend.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test1234","role":"STUDENT"}'

# Login
curl -X POST https://your-backend.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'
```

### Browser Tests
- [ ] Visit `https://your-app.vercel.app` — loads correctly
- [ ] Login — JWT stored in localStorage, redirected to dashboard
- [ ] Refresh page on `/dashboard` — stays authenticated (NOT redirected to login)
- [ ] Navigate to `/questions` directly — does NOT 404
- [ ] Upload a file (study materials) — uploads to Cloudinary successfully
- [ ] Real-time messaging — Socket.IO connected (no CORS errors in browser console)

---

## 5 · Environment Variable Summary

### Render (Backend) — All Required

| Variable | Description |
|----------|-------------|
| `PORT` | Set to `10000` (Render's default) |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | Your Vercel app URL (e.g. `https://your-app.vercel.app`) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Long random string (min 32 chars) |
| `JWT_REFRESH_SECRET` | Different long random string |
| `JWT_ACCESS_EXPIRATION` | `15m` |
| `JWT_REFRESH_EXPIRATION` | `7d` |
| `JWT_VERIFY_EMAIL_EXPIRATION` | `24h` |
| `JWT_RESET_PASSWORD_EXPIRATION` | `1h` |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username / email |
| `SMTP_PASS` | SMTP password / app password |
| `EMAIL_FROM` | Sender display name and email |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `GEMINI_API_KEY` | From Google AI Studio |

### Vercel (Frontend) — Required

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full Render backend URL + `/api/v1` |

---

## 6 · Common Issues & Fixes

### "CORS Error" in browser console
- Check `FRONTEND_URL` on Render matches your exact Vercel URL (no trailing slash)
- Make sure both are on HTTPS in production

### Cookies not sent (token refresh fails / user logged out on refresh)
- Verify `NODE_ENV=production` is set on Render
- Verify both frontend and backend use HTTPS (required for `sameSite: 'none'`)

### Socket.IO connection fails
- `VITE_API_URL` must point to the Render backend (not Vercel)
- Socket.IO CORS uses the same `FRONTEND_URL` allowlist as REST CORS

### 404 on page refresh (e.g. `/dashboard`)
- Ensure `vercel.json` is committed and present in the `frontend/` folder

### MongoDB connection timeout
- Add `0.0.0.0/0` to MongoDB Atlas Network Access IP allowlist
- Verify `MONGODB_URI` includes `?retryWrites=true&w=majority`

### Render free tier sleeps after 15 minutes
- First request after sleep takes ~30 seconds (cold start)
- Upgrade to a paid Render plan or use UptimeRobot to ping `/health` every 5 minutes
