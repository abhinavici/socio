const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    // The two participants in this DM
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // Quick reference to the latest message (for chat list preview)
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // Track unread count per participant
    // e.g. { "userId1": 3, "userId2": 0 }
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Index so we can quickly find a conversation between two specific users
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);