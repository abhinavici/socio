import { Navigate } from "react-router-dom";
import { clearToken, getToken, isTokenValid } from "../utils/auth";

function ProtectedRoute({ children }) {
  const token = getToken();

  if (!isTokenValid(token)) {
    clearToken();
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
