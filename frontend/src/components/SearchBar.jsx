import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search — wait 400ms after user stops typing
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        const { data } = await API.get(`/users/search?q=${query.trim()}`);
        setResults(data);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleSelect = (username) => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    navigate(`/user/${username}`);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <input
        className="input-field"
        type="text"
        placeholder="Search people..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ margin: 0, width: "220px", padding: "8px 14px", fontSize: "14px" }}
      />

      {isLoading && (
        <p style={{ position: "absolute", top: "42px", left: 0, fontSize: "13px", color: "var(--muted)", background: "var(--panel)", padding: "8px 14px", borderRadius: "var(--radius-sm)", width: "220px" }}>
          Searching...
        </p>
      )}

      {isOpen && results.length === 0 && !isLoading && (
        <div style={{ position: "absolute", top: "42px", left: 0, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", width: "220px", padding: "12px 14px", fontSize: "13px", color: "var(--muted)" }}>
          No users found
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div style={{ position: "absolute", top: "42px", left: 0, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", width: "220px", boxShadow: "var(--shadow)", zIndex: 200 }}>
          {results.map((user) => (
            <div
              key={user._id}
              onClick={() => handleSelect(user.username)}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--mint)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {/* Avatar */}
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--mint)", overflow: "hidden", flexShrink: 0, border: "2px solid var(--sea)" }}>
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "var(--sea)", fontWeight: 700 }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                }
              </div>

              {/* Info */}
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>{user.name}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>@{user.username}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
