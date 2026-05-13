# 🚀 Deployment Guide — Quiz App

## Architecture
- **Frontend** → Vercel (React)
- **Backend** → Railway (Node.js/Express)
- **Database** → Railway MySQL plugin

---

## Step 1: Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) → your backend project
2. Add a **MySQL** plugin (if not done)
3. Go to **Variables** tab and add:

```
DB_HOST=       ← from Railway MySQL plugin (use internal host)
DB_USER=       ← from Railway MySQL plugin
DB_PASSWORD=   ← from Railway MySQL plugin
DB_NAME=       quiz_app
DB_PORT=       3306
JWT_SECRET=    some_long_random_string_here
FRONTEND_URL=  https://your-app.vercel.app   ← your Vercel URL
PORT=          5000
```

4. Run your `database.sql` file to create tables (use Railway's MySQL shell)
5. Deploy — Railway will auto-detect `package.json` and run `npm start`

---

## Step 2: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → your project
2. Go to **Settings → Environment Variables** and add:

```
REACT_APP_API_URL = https://your-railway-backend.up.railway.app/api
```

   ⚠️ Replace with your actual Railway backend URL (found in Railway → Settings → Domains)

3. Redeploy the frontend (or it will auto-deploy on next push)

---

## ⚠️ Common Mistakes

| Problem | Cause | Fix |
|---|---|---|
| Frontend shows blank / API errors | `REACT_APP_API_URL` not set in Vercel | Add env var in Vercel dashboard |
| Backend crashes on start | DB env vars missing in Railway | Add all DB_* vars in Railway Variables tab |
| CORS errors in browser | `FRONTEND_URL` not set on Railway | Add your Vercel URL to Railway env vars |
| 401 Unauthorized everywhere | `JWT_SECRET` not set | Add a real secret in Railway vars |

---

## Files Changed from Original

1. **`frontend/src/api.js`** — Changed hardcoded `localhost:5000` to use `REACT_APP_API_URL` env variable
2. **`backend/server.js`** — CORS now uses `FRONTEND_URL` env variable instead of allowing all origins
