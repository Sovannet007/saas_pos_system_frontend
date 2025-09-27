// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // If not logged in → go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // (optional) If owner without a company yet → force company selection
  if (
    user?.role_id === 1 &&
    !user?.company_id &&
    location.pathname !== "/select-company"
  ) {
    return <Navigate to="/select-company" replace />;
  }

  return children;
}
