import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import conncetDB from './database/connction.js';
import authRoutes from './routes/auth.routes.js';
import taskRouter from './routes/task.routes.js';
import boardRoutes from './routes/board.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import path from "path";
import { cleanupTempFolder } from './library/cloudinary.js';
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 9000;
const __dirname = path.resolve();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/task', taskRouter);
app.use('/api/board', boardRoutes);
app.use('/api/notifications', notificationRoutes);

// serve static files from frontend build
app.use(express.static(path.join(__dirname, "../frontend/dist")));


app.get("*", (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is online at: http://localhost:${PORT}`);
  // hope temp directory exists
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log('Temp directory created:', tempDir);
  }
  conncetDB();
  cleanupTempFolder();
});