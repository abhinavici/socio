import SearchBar from "./SearchBar";
import { Link, useNavigate } from "react-router-dom";
import { removeToken } from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar">
      <Link to="/feed" className="navbar-brand">SocioSpace</Link>

      <div className="navbar-links">
        <Link to="/feed">Feed</Link>
        <Link to="/drafts">Drafts</Link>
        <Link to="/profile">Profile</Link>
      </div>
      <SearchBar />

      <button className="navbar-logout" onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
}

export default Navbar;