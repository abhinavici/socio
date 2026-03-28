const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: false,
      trim: true,
      maxlength: 2000,
    },
    messageType: {
      type: String,
      enum: ["text", "image"],
      default: "text",
    },
    mediaURL: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Fast lookup: get all messages for a conversation sorted by time
messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);