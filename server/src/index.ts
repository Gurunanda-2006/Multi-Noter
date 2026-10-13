import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { authRouter } from './routes/auth';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'dev-secret-change-me';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:8081';
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

app.use('/auth', authRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`PSH Server listening on http://localhost:${PORT}`);
});

export default app;
