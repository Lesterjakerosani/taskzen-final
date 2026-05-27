import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import authRouter from "./routes/auth";
import landingRouter from "./routes/landing";
import tasksRouter from "./routes/tasks";
import notesRouter from "./routes/notes";
import profileRouter from "./routes/profile";
import timerRouter from "./routes/timer";
import sessionsRouter from "./routes/sessions";
import aiRouter from "./routes/ai";
import reviewersRouter from "./routes/reviewers";
import passport from "./lib/passport";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET ?? "taskzen-dev-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 10 * 60 * 1000 }, // 10 min — only for OAuth handshake
}));

app.use(passport.initialize());
app.use(passport.session());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/landing", landingRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/notes", notesRouter);
app.use("/api/user/profile", profileRouter);
app.use("/api/timer-settings", timerRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/reviewers", reviewersRouter);

app.listen(PORT, () => {
  console.log(`TaskZen backend running on http://localhost:${PORT}`);
});
