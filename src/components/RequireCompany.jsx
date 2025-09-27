import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireCompany({ children }) {
  const { user, isSystemOwner } = useAuth();
  if (isSystemOwner && !user?.company_id) {
    return <Navigate to="/select-company" replace />;
  }
  return children;
}
