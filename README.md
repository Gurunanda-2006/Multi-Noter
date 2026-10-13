# Multi-Noter (Personal Storage Hub)

A personal storage and knowledge hub that saves text notes, documents, images, and videos directly into your own Google Drive — accessible across Web, Android, and iOS with zero third-party databases.

---

## Project Structure

```
MULTI NOTER/
├── frontend/               # React Native + Expo Web frontend
│   ├── app/                # Expo Router screens (Tabs, Note Editor, Upload, Viewer)
│   ├── components/         # UI Design System, File Cards, Dialogs, Toasts
│   ├── services/           # Google Drive API v3 client, OAuth PKCE, Cache, Download
│   ├── types/              # TypeScript models
│   ├── utils/              # MIME classification, Filename sanitization, Validation
│   ├── vercel.json         # Vercel deployment configuration
│   └── package.json
│
├── backend/                # Node.js + Express TypeScript server
│   ├── src/
│   │   ├── index.ts        # Express server entry point
│   │   └── routes/auth.ts  # Secure OAuth token exchange & refresh proxy
│   └── package.json
│
└── .gitignore              # Protects .env files from being pushed
```

---

## Local Development

### 1. Run the Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:3001` (Health check: `http://localhost:3001/health`).

### 2. Run the Frontend
```bash
cd frontend
npm install
npm run web
```
Frontend runs on `http://localhost:8081`.

---

## Deployment Instructions

### Backend (Render)
1. In Render, create a **Web Service** from this GitHub repository.
2. Set **Root Directory** to `backend`.
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Set Environment Variables from `backend/.env.example`.

### Frontend (Vercel)
1. In Vercel, import this repository.
2. Set **Root Directory** to `frontend`.
3. Set Environment Variables from `frontend/.env.example`.
4. Deploy!
