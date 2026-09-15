import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "./config/passport";

import emailRoutes from "./routes/email.routes";
import authRoutes from "./routes/auth.routes";

import { serverAdapter } from "./config/bull-board";

const app = express();

// Trust Render's reverse proxy
app.set("trust proxy", 1);

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// JSON
app.use(express.json());

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Health
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

// Auth
app.use("/auth", authRoutes);

// Bull Board
app.use(
  "/admin/queues",
  serverAdapter.getRouter()
);

// Emails
app.use("/api/emails", emailRoutes);

export default app;