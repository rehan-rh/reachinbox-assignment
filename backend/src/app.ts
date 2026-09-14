import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "./config/passport";

import emailRoutes from "./routes/email.routes";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
    },
  })
);

// Initialize Passport
app.use(passport.initialize());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/auth", authRoutes);

app.use("/api/emails", emailRoutes);

export default app;