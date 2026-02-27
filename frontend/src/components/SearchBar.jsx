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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div ref={wrapperRef} className="searchbar">
      <input
        className="input-field searchbar__input"
        type="text"
        placeholder="Search people..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {isLoading && (
        <div className="searchbar__dropdown">
          <p className="searchbar__loading">Searching...</p>
        </div>
      )}

      {isOpen && results.length === 0 && !isLoading && (
        <div className="searchbar__dropdown">
          <p className="searchbar__empty">No users found</p>
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="searchbar__dropdown">
          {results.map((user) => (
            <div key={user._id} className="searchbar__result" onClick={() => handleSelect(user.username)}>
              <div className="avatar avatar--sm">
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} />
                  : <span className="avatar--initial">{user.name?.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div>
                <p className="searchbar__result-name">{user.name}</p>
                <p className="searchbar__result-handle">@{user.username}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
