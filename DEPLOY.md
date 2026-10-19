# INBARE — Free Deployment Guide

Recommended stack (all free tiers):
- **Frontend:** Vercel (client/)
- **Backend:** Render (server/)
- **Database:** Render PostgreSQL (free, attached to backend)

## Prerequisites

- GitHub account
- Vercel account (vercel.com)
- Render account (render.com)

---

## Step 1: Push code to GitHub

The repo is already configured with remote `origin`.

```bash
git push origin main
```

---

## Step 2: Deploy Backend on Render

### Option A — render.yaml (one-click)

1. In Render, go to **Dashboard → New → Infrastructure as Code**.
2. Connect your GitHub repo `Imantha0309/Inbare_Clothing`.
3. Select the `render.yaml` at the repo root.
4. Render will create:
   - A free PostgreSQL database (`inbare-db`)
   - A free Node web service (`inbare-api`)
5. After deploy, set the following env vars in Render dashboard (**Environment** tab):
   - `CORS_ORIGIN` = `https://your-frontend.vercel.app`
   - `CLIENT_URL` = `https://your-frontend.vercel.app`
   - `ADMIN_EMAIL` = your admin email
   - `ADMIN_PASSWORD` = strong password
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (optional — order confirmation emails skip if unset)
6. Copy the Render service URL (e.g., `https://inbare-api.onrender.com`).

### Option B — Manual web service

1. Render → **New → Web Service** → connect GitHub repo.
2. Root directory: leave empty (or specify `server` if supported; otherwise set build/start commands).
3. Build command: `cd server && npm install`
4. Start command: `cd server && node src/server.js`
5. Add the PostgreSQL database (Render → **New → PostgreSQL**, free plan).
6. Link the database to the web service so `DATABASE_URL` is injected automatically.
7. Set env vars as listed in Option A.

> **Note:** Render free web services spin down after ~15 min of inactivity. The first request after sleep takes ~30s to wake up.

---

## Step 3: Deploy Frontend on Vercel

1. Vercel → **Add New → Project** → import `Imantha0309/Inbare_Clothing`.
2. Framework preset: **Vite**.
3. Root directory: `client` (important!).
4. Build command: `npm run build` (Vercel auto-detects).
5. Output directory: `dist` (Vercel auto-detects).
6. Add Environment Variable:
   - `VITE_API_URL` = `https://your-render-backend.onrender.com`
   - Environment: Production, Preview, Development (all three).
7. Deploy.

### vercel.json (already in client/)

The existing `client/vercel.json` handles SPA routing:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

---

## Step 4: Connect Frontend to Backend

1. In Vercel, go to **Project → Settings → Environment Variables**.
2. Ensure `VITE_API_URL` points to your Render backend URL.
3. Redeploy the frontend.

---

## Step 5: Seed the Admin User

The backend auto-seeds an admin user on startup from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars. If you didn't set those, the seed uses defaults (`admin@inbare.com` / `admin123`) — **change them in production.**

Log in at `https://your-frontend.vercel.app/admin` with the admin credentials.

---

## Environment Variable Summary

| Variable | Backend (Render) | Frontend (Vercel) |
|----------|-----------------|-------------------|
| `NODE_ENV` | `production` | — |
| `PORT` | Render sets automatically | — |
| `DATABASE_URL` | Render provides automatically | — |
| `JWT_SECRET` | Generate a strong random string | — |
| `JWT_EXPIRE` | `7d` | — |
| `CORS_ORIGIN` | `https://your-frontend.vercel.app` | — |
| `CLIENT_URL` | `https://your-frontend.vercel.app` | — |
| `ADMIN_EMAIL` | your admin email | — |
| `ADMIN_PASSWORD` | strong password | — |
| `SMTP_HOST` | optional | — |
| `SMTP_PORT` | `587` (optional) | — |
| `SMTP_USER` | optional | — |
| `SMTP_PASS` | optional | — |
| `VITE_API_URL` | — | `https://your-backend.onrender.com` |

---

## Troubleshooting

- **Cookies not sent cross-origin:** Ensure `VITE_API_URL` uses `https://` and the backend sets `sameSite: "none", secure: true` (already configured in `sendToken.js`).
- **Database connection fails:** On Render, `DATABASE_URL` is injected automatically when the PostgreSQL DB is linked to the web service.
- **Build fails:** Ensure `client/package.json` has `"build": "vite build"` and `"type": "module"`.
- **404 on page refresh:** Vercel's `vercel.json` rewrite handles SPA routing; ensure it's in `client/`.
