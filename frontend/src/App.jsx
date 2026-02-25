import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { AUTH_LOGOUT_EVENT } from "./services/api";
import UserProfile from "./pages/UserProfile";
import Feed from "./pages/Feed";

function AuthRedirectBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = () => {
      navigate("/login", { replace: true });
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    return () => {
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    };
  }, [navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <AuthRedirectBridge />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route 
           path="/user/:username" 
           element={
           <ProtectedRoute>
             <UserProfile />
           </ProtectedRoute>
          } 
        />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
