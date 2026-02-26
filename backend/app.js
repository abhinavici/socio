const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const userRoutes = require("./routes/userRoutes");
const followRoutes = require("./routes/followRoutes"); 
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const taskRoutes = require("./routes/taskRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const protect = require("./middleware/authMiddleware");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

const toPositiveInteger = (value, fallbackValue) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackValue;
};

const resolveAllowedOrigins = () => {
  const rawOrigins = process.env.CORS_ORIGINS || "";
  const parsedOrigins = rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return parsedOrigins.length > 0 ? parsedOrigins : DEFAULT_ALLOWED_ORIGINS;
};

const allowedOrigins = new Set(resolveAllowedOrigins());
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    const error = new Error("CORS origin denied");
    error.statusCode = 403;
    return callback(error);
  },
};

const authLimiter = rateLimit({
  windowMs: toPositiveInteger(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: toPositiveInteger(process.env.AUTH_RATE_LIMIT_MAX, 50),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication requests, please try again later.",
  },
});

app.disable("x-powered-by");
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "You accessed protected route", user: req.user });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes); 
app.use("/api/follow", followRoutes);
app.use("/api/posts", postRoutes); 
app.use("/api/comments", commentRoutes); 
app.use("/api/tasks", taskRoutes); 
app.use("/api/categories", categoryRoutes);
app.use("/api/notifications", notificationRoutes);


app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use(notFound);
app.use(errorHandler);

app.use((err, req, res, next) => {
  console.error('Error message:', err.message);
  console.error('Stack trace:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

module.exports = app;
