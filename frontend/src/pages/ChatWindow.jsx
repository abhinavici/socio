import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";
import { useSocketContext } from "../context/SocketContext";

function ChatWindow() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { socket, userId: myId } = useSocketContext();

  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const typingTimerRef = useRef(null);
  const bottomRef = useRef(null);

  const otherUser = conversation?.participants?.find(
    (p) => p._id.toString() !== myId?.toString()
  );

  // ── Load conversation + message history ────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data: convData } = await API.get("/messages/conversations");
        const conv = convData.find((c) => c._id === conversationId);
        setConversation(conv);
        const { data: msgData } = await API.get(
          `/messages/conversations/${conversationId}/messages`
        );
        setMessages(msgData);
      } catch (err) {
        console.error("Failed to load chat", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [conversationId]);

  // ── Auto-scroll to latest message ──────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Socket listeners ────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", ({ message, conversationId: cId }) => {
      if (cId === conversationId) setMessages((prev) => [...prev, message]);
    });

    socket.on("messageSent", (message) => {
      setMessages((prev) => prev.map((m) => (m._id === "sending" ? message : m)));
      setIsSending(false);
    });

    socket.on("messagesRead", ({ conversationId: cId }) => {
      if (cId === conversationId) {
        setMessages((prev) =>
          prev.map((m) => {
            const sid = (m.sender?._id || m.sender)?.toString();
            return sid === myId?.toString() ? { ...m, isRead: true } : m;
          })
        );
      }
    });

    socket.on("userTyping", ({ conversationId: cId }) => {
      if (cId === conversationId) setIsTyping(true);
    });

    socket.on("userStoppedTyping", ({ conversationId: cId }) => {
      if (cId === conversationId) setIsTyping(false);
    });

    socket.on("messageError", () => {
      setIsSending(false);
      setMessages((prev) => prev.filter((m) => m._id !== "sending"));
    });

    socket.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, text: "This message was deleted", isDeletedForEveryone: true }
            : m
        )
      );
    });

    return () => {
      socket.off("newMessage");
      socket.off("messageSent");
      socket.off("messagesRead");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
      socket.off("messageError");
      socket.off("messageDeleted");
    };
  }, [socket, conversationId, myId]);

  // ── Mark as read once socket + otherUser are ready ─────────
  useEffect(() => {
    if (!socket || !otherUser || !myId) return;
    const timer = setTimeout(() => {
      socket.emit("markAsRead", { conversationId, senderId: otherUser._id, readerId: myId });
    }, 500);
    return () => clearTimeout(timer);
  }, [socket, otherUser, myId, conversationId]);

  // ── Typing indicator ────────────────────────────────────────
  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket || !otherUser) return;
    socket.emit("typing", { conversationId, receiverId: otherUser._id, senderName: "You" });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("stopTyping", { conversationId, receiverId: otherUser._id });
    }, 2000);
  };

  // ── Send message ────────────────────────────────────────────
  const handleSend = () => {
    if (!text.trim() || !socket || isSending) return;
    setIsSending(true);
    const optimistic = {
      _id: "sending",
      conversation: conversationId,
      sender: { _id: myId, name: "You" },
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    clearTimeout(typingTimerRef.current);
    socket.emit("stopTyping", { conversationId, receiverId: otherUser._id });
    socket.emit("sendMessage", {
      conversationId,
      text: optimistic.text,
      receiverId: otherUser._id,
      senderId: myId,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteForMe = async (messageId) => {
    try {
      await API.delete(`/messages/${messageId}/delete-for-me`);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleDeleteForEveryone = async (messageId) => {
    try {
      await API.delete(`/messages/${messageId}/delete-for-everyone`);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, text: "This message was deleted", isDeletedForEveryone: true }
            : m
        )
      );
      if (socket && otherUser) {
        socket.emit("messageDeleted", { messageId, conversationId, receiverId: otherUser._id });
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="chat-page-loading">Loading chat...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div
        className="chat-page"
        onClick={() => activeMenu && setActiveMenu(null)}
        style={{position: "fixed", top: "var(--navbar-h, 60px)", left: 0, right: 0, bottom: 0 }}
      >
        <div className="chat-card">

          {/* ── Header ── */}
          <div className="chat-card__header">
            <button className="chat-card__back" onClick={() => navigate("/messages")}>←</button>
            <div className="avatar avatar--md">
              {otherUser?.avatar
                ? <img src={otherUser.avatar} alt={otherUser.name} />
                : <span className="avatar--initial">{otherUser?.name?.charAt(0).toUpperCase()}</span>
              }
            </div>
            <div>
              <p className="chat-card__user-name">{otherUser?.name}</p>
              <p className="chat-card__user-handle">@{otherUser?.username}</p>
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="chat-card__messages">
            {messages.length === 0 && (
              <p className="chat-card__empty">No messages yet. Say hi! 👋</p>
            )}

            {messages.map((msg) => {
              const isMe = msg.sender?._id === myId || msg.sender === myId;
              const isDeleted = msg.isDeletedForEveryone;
              const isSendingMsg = msg._id === "sending";

              const bubbleClass = [
                "chat-bubble",
                isMe ? "chat-bubble--me" : "chat-bubble--them",
                isDeleted ? "chat-bubble--deleted" : "",
                isSendingMsg ? "chat-bubble--sending" : "",
              ].filter(Boolean).join(" ");

              return (
                <div
                  key={msg._id}
                  className={`chat-msg-row ${isMe ? "chat-msg-row--me" : "chat-msg-row--them"}`}
                  onClick={(e) => { e.stopPropagation(); activeMenu === msg._id && setActiveMenu(null); }}
                >
                  {/* position:relative wrapper for context menu */}
                  <div style={{ position: "relative" }}>

                    <div
                      className={bubbleClass}
                      onContextMenu={(e) => {
                        if (!isDeleted) { e.preventDefault(); setActiveMenu(activeMenu === msg._id ? null : msg._id); }
                      }}
                      onDoubleClick={() => {
                        if (!isDeleted) setActiveMenu(activeMenu === msg._id ? null : msg._id);
                      }}
                    >
                      {/*
                        Spacer trick (Telegram/WhatsApp style):
                        - __spacer is invisible (visibility:hidden, height:0, float:right)
                        - It mirrors the exact content of __meta
                        - This forces the bubble to be wide enough for timestamp to fit
                          on the same visual line as the last line of text
                        - __meta is the real visible timestamp, also float:right
                        - overflow:hidden on .chat-bubble contains both floats
                      */}
                      <span className="chat-bubble__spacer" aria-hidden="true">
                        {isSendingMsg ? "sending..." : formatTime(msg.createdAt)}
                        {isMe && !isSendingMsg && !isDeleted ? " ✓✓" : ""}
                      </span>

                      <span className="chat-bubble__body">{msg.text}</span>

                      <div className="chat-bubble__meta">
                        {isSendingMsg ? "sending..." : formatTime(msg.createdAt)}
                        {isMe && !isSendingMsg && !isDeleted && (
                          <span className={`chat-bubble__ticks ${msg.isRead ? "chat-bubble__ticks--read" : "chat-bubble__ticks--unread"}`}>
                            ✓✓
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Context menu — sibling of bubble, inside relative wrapper */}
                    {activeMenu === msg._id && !isDeleted && (
                      <div className={`chat-context-menu ${isMe ? "chat-context-menu--me" : "chat-context-menu--them"}`}>
                        <button
                          className="chat-context-btn"
                          onClick={() => { handleDeleteForMe(msg._id); setActiveMenu(null); }}
                        >
                          🗑️ Delete for me
                        </button>
                        {isMe && (
                          <button
                            className="chat-context-btn chat-context-btn--danger"
                            onClick={() => { handleDeleteForEveryone(msg._id); setActiveMenu(null); }}
                          >
                            🗑️ Delete for everyone
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="chat-typing-row">
                <div className="chat-typing-bubble">{otherUser?.name} is typing...</div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Input ── */}
          <div className="chat-card__input">
            <input
              className="input-field"
              type="text"
              placeholder="Type a message..."
              value={text}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
            />
            <button
              className="btn btn-primary chat-card__send"
              onClick={handleSend}
              disabled={!text.trim() || isSending}
            >
              Send
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

export default ChatWindow;
