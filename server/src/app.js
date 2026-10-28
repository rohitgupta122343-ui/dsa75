
import express from 'express';
import cors from 'cors';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: 'https://dsa75.vercel.app',
    credentials: true
  }));

  app.use(express.json());

  // Apne existing middleware aur routes yahan rakho

  return app;
}
