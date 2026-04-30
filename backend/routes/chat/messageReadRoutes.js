// import express from "express";
// import { messageReadController } from "../../controllers/chat/messageRead.controller.js";

// const router = express.Router();

// // Đánh dấu 1 message đã đọc
// router.post("/mark-read", messageReadController.markAsRead);

// // Đánh dấu nhiều message đã đọc cùng lúc
// router.post("/bulk-mark-read", messageReadController.bulkMarkAsRead);

// // Lấy danh sách đọc của 1 message
// router.get("/message/:messageId", messageReadController.getReadsByMessage);

// // Lấy danh sách message đã đọc của 1 user
// router.get("/user/:userId", messageReadController.getReadsByUser);

// // Xóa đánh dấu đọc 1 message của 1 user
// router.delete("/delete-read", messageReadController.deleteRead);

// // Xóa tất cả đánh dấu đọc của 1 message
// router.delete(
//   "/message/:messageId",
//   messageReadController.deleteAllReadsForMessage
// );

// // Xóa tất cả đánh dấu đọc của 1 user
// router.delete("/user/:userId", messageReadController.deleteAllReadsForUser);

// export default router;
