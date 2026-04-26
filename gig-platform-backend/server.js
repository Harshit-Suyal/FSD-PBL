import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import userRoutes from "./routes/userRoutes.js";
import gigRoutes from "./routes/gigRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { setSocketIO } from "./utils/socket.js";
import { canAccessGigChat } from "./utils/chatAccess.js";

dotenv.config();

const app = express();
const server = createServer(app);
const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";
const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    credentials: true,
  },
});

setSocketIO(io);

io.use(async (socket, next) => {
  try {
    const authHeader = socket.handshake.auth?.token || socket.handshake.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      return next(new Error("User not found or deactivated"));
    }

    socket.user = user;
    return next();
  } catch (error) {
    return next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.user._id.toString();
  socket.join(`user:${userId}`);

  socket.on("join:gig", async ({ gigId }) => {
    if (!gigId) return;

    try {
      const access = await canAccessGigChat(gigId, userId, socket.user.role);
      if (!access.ok) {
        socket.emit("socket:error", { message: access.message });
        return;
      }

      socket.join(`gig:${gigId}`);
      socket.emit("gig:joined", { gigId });
    } catch (error) {
      socket.emit("socket:error", { message: error.message });
    }
  });

  socket.on("leave:gig", ({ gigId }) => {
    if (gigId) {
      socket.leave(`gig:${gigId}`);
    }
  });
});

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("GigConnect API is running ");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();