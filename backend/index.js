import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

import connectDB from "./configs/db.js";
import registerChatHandlers from "./sockets/chatSocket.js";
import { initSocket } from "./sockets/socket.js";
import { jwtConfig } from "./configs/config.js";

import authRoute from "./routes/auth/auth.route.js";
import categoryRoutes from "./routes/category/category.route.js";
import auditLogRoutes from "./routes/auditLog/auditLogRoutes.js";
import courseRoutes from "./routes/course/course.routes.js";

import instructorRoutes from "./routes/instructor/instructor.routes.js";
import studentRoutes from "./routes/student/student.routes.js";
import userRoute from "./routes/user/user.routes.js";
import roleRoutes from "./routes/role/role.routes.js";
import permissionRoute from "./routes/permission/permission.routes.js";
import rolePermissionRoutes from "./routes/roleAndPermission/rolePermission.routes.js";
import chatRoutes from "./routes/chat/index.js";
import userBlockRoutes from "./routes/userBlocks/userBlockRoutes.js";
import notificationRoutes from "./routes/notification/notification.routes.js";
import commentRoutes from "./routes/comment/comment.routes.js";
import paymentRoutes from "./routes/payment/payment.routes.js";
import orderRoutes from "./routes/payment/orders.routes.js";
import discountsRoutes from "./routes/payment/discount.routes.js";
import lessonRoutes from "./routes/lesson/lesson.routes.js";
import quizRoutes from "./routes/quiz/quiz.routes.js";
import questionRoutes from "./routes/quiz/question.routes.js";
import studentQuizAttemptRoutes from "./routes/StudentQuizAttempt/studentQuizAttempt.routes.js";
import studentAnswerRoutes from "./routes/quiz/studentAnswer.routes.js";
import modulesRoutes from "./routes/module/module.routes.js";
import lessonProgressRoutes from "./routes/lessonProgress/lessonProgress.routes.js";
import searchRoutes from "./routes/search/search.routes.js";
import dashboardRoutes from "./routes/dashboard/dashboard.route.js";
import statsRoutes from "./routes/stats/statsRoutes.js";
import contactRoutes from "./routes/contact/contact.routes.js";
import instructorRequestRoutes from "./routes/instructorRequest/instructorRequest.routes.js";

dotenv.config();

const app = express();
connectDB();

const server = createServer(app);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/auth", authRoute);
app.use("/roles", roleRoutes);
app.use("/categories", categoryRoutes);
app.use("/courses", courseRoutes);
app.use("/audit-logs", auditLogRoutes);
app.use("/permissions", permissionRoute);
app.use("/role-permissions", rolePermissionRoutes);
app.use("/instructors", instructorRoutes);
app.use("/students", studentRoutes);
app.use("/users", userRoute);
app.use("/chat", chatRoutes);
app.use("/user-blocks", userBlockRoutes);
app.use("/notifications", notificationRoutes);
app.use("/comments", commentRoutes);
app.use("/payments", paymentRoutes);
app.use("/orders", orderRoutes);
app.use("/discounts", discountsRoutes);
app.use("/lessons", lessonRoutes);
app.use("/quizzes", quizRoutes);
app.use("/questions", questionRoutes);
app.use("/student-quiz-attempts", studentQuizAttemptRoutes);
app.use("/student-answers", studentAnswerRoutes);
app.use("/modules", modulesRoutes);
app.use("/lesson-progress", lessonProgressRoutes);
app.use("/search", searchRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/contact", contactRoutes);
app.use("/instructor-requests", instructorRequestRoutes);
app.use("/stats", statsRoutes);

const io = initSocket(server);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));

  try {
    const decoded = jwt.verify(token, jwtConfig.accessTokenSecret);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  registerChatHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server chạy trên port ${PORT}`);
});
