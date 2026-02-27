const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const http = require("http");        // Node's built-in HTTP module
const { Server } = require("socket.io");
const app = require("./app");

const Message = require("./models/Message");
const Conversation = require("./models/Conversation");
const Notification = require("./models/Notification");

const PORT = process.env.PORT || 5000;

// ─── Create HTTP server manually ─────────────────────────────────────────────
// Instead of app.listen() we wrap Express in a raw HTTP server
// This lets Socket.io attach to the same port
const server = http.createServer(app);

// ─── Attach Socket.io to the HTTP server ─────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ─── Track online users ───────────────────────────────────────────────────────
// A simple Map: { userId -> socketId }
// When user connects we store them, when they disconnect we remove them
// This lets us know if a user is currently online
const onlineUsers = new Map();

// ─── Socket.io connection handler ────────────────────────────────────────────
// This runs every time a user opens the app and connects
io.on("connection", (socket) => {
  console.log("New socket connection:", socket.id);

  // ── Event: user comes online ──────────────────────────────────────────────
  // Frontend emits this right after connecting, sending their userId
  socket.on("userOnline", (userId) => {
    onlineUsers.set(userId, socket.id);

    // Join a personal room named after their userId
    // This lets us send messages directly to this user by userId
    socket.join(userId);

    console.log(`User ${userId} is online`);

    // Tell everyone this user is now online (for online indicators)
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  // ── Event: send a message ─────────────────────────────────────────────────
  // Frontend emits this when user hits send
  // data = { conversationId, text, receiverId }
  socket.on("sendMessage", async (data) => {
    try {
      const { conversationId, text, receiverId, senderId } = data;

      // 1. Save message to MongoDB
      const message = await Message.create({
        conversation: conversationId,
        sender: senderId,
        text: text.trim(),
      });

      // 2. Populate sender info so frontend can display name/avatar
      await message.populate("sender", "name username avatar");

      // 3. Update the conversation's lastMessage and bump updatedAt
      //    Also increment unread count for the receiver
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        $inc: { [`unreadCount.${receiverId}`]: 1 },
      });

      // 4. Emit the message back to the SENDER
      //    So their own chat window shows it immediately
      socket.emit("messageSent", message);

      // 5. Emit the message to the RECEIVER
      //    io.to(room) sends to everyone in that room (the receiver's personal room)
      io.to(receiverId).emit("newMessage", {
        message,
        conversationId,
      });

      // 6. Create a notification for the receiver (uses our existing system!)
      await Notification.create({
        recipient: receiverId,
        sender: senderId,
        type: "message",
        refId: conversationId,
      });

      // 7. Emit notification event to receiver so their bell updates live
      io.to(receiverId).emit("newNotification");

    } catch (err) {
      console.error("sendMessage error:", err);
      // Tell the sender something went wrong
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });

  // ── Event: typing indicator ───────────────────────────────────────────────
  // Frontend emits this while user is typing
  // data = { conversationId, receiverId, senderName }
  socket.on("typing", (data) => {
    // Forward the typing event to the receiver only
    io.to(data.receiverId).emit("userTyping", {
      conversationId: data.conversationId,
      senderName: data.senderName,
    });
  });

  // ── Event: stopped typing ─────────────────────────────────────────────────
  socket.on("stopTyping", (data) => {
    io.to(data.receiverId).emit("userStoppedTyping", {
      conversationId: data.conversationId,
    });
  });
  // ── Event: delete message for everyone ───────────────────────────────────
  socket.on("messageDeleted", (data) => {
  // Forward to the receiver so their UI updates instantly
    io.to(data.receiverId).emit("messageDeleted", {
     messageId: data.messageId,
     conversationId: data.conversationId,
  });
 });
 // ── Event: mark messages as read ─────────────────────────────────────────
// Frontend emits this when user opens a conversation
// data = { conversationId, senderId } — senderId is the OTHER person (whose messages we're marking read)
socket.on("markAsRead", async (data) => {
  try {
    const { conversationId, senderId, readerId } = data;

    // Mark all unread messages from sender as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: senderId,
        isRead: false,
      },
      { isRead: true }
    );

    // Reset unread count for reader in conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { [`unreadCount.${readerId}`]: 0 },
    });

    // Notify the sender that their messages were read
    // So their UI can update ticks from grey to blue
    io.to(senderId).emit("messagesRead", { conversationId });

  } catch (err) {
    console.error("markAsRead error:", err);
  }
});

  // ── Event: disconnect ─────────────────────────────────────────────────────
  // Runs automatically when user closes tab or loses connection
  socket.on("disconnect", () => {
    // Find and remove this socket from onlineUsers
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} went offline`);
        break;
      }
    }
    // Update everyone's online status
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set");
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");

    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log("MongoDB connected");

    // Use server.listen NOT app.listen — Socket.io needs the HTTP server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
};

startServer();