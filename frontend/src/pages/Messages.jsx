import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";
import { useSocketContext } from "../context/SocketContext";

function Messages() {
  const { userId: myId } = useSocketContext();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await API.get("/messages/conversations");
        setConversations(data);
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const getOtherParticipant = (conversation, myId) =>
    conversation.participants.find((p) => p._id.toString() !== myId.toString());

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />

        <main className="auth-card auth-card--wide auth-card--padless">
          <div className="messages-header">
            <h2>Messages</h2>
          </div>

          {isLoading ? (
            <p className="messages-loading">Loading...</p>
          ) : conversations.length === 0 ? (
            <div className="messages-empty">
              <p className="messages-empty__emoji">💬</p>
              <p>No conversations yet.</p>
              <p className="messages-empty__hint">Search for someone you follow and start chatting!</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv, myId);
              const unread = conv.unreadCount?.get
                ? conv.unreadCount.get(myId) || 0
                : conv.unreadCount?.[myId] || 0;

              return (
                <div
                  key={conv._id}
                  className={`conversation-item ${unread > 0 ? "conversation-item--unread" : ""}`}
                  onClick={() => navigate(`/messages/${conv._id}`)}
                >
                  <div className="avatar avatar--lg">
                    {other?.avatar
                      ? <img src={other.avatar} alt={other.name} />
                      : <span className="avatar--initial">{other?.name?.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div className="conversation-item__info">
                    <p className={`conversation-item__name ${unread > 0 ? "conversation-item__name--bold" : ""}`}>
                      {other?.name}
                    </p>
                    <p className="conversation-item__handle">@{other?.username}</p>
                  </div>
                  {unread > 0 && (
                    <span className="unread-badge">{unread > 9 ? "9+" : unread}</span>
                  )}
                </div>
              );
            })
          )}
        </main>
      </div>
    </>
  );
}

export default Messages;
