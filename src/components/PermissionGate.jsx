import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PermissionGate({ roles = [], children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/unauthorized" replace />;
  if (roles.length > 0 && !roles.includes(user.role_id)) {
    return <Navigate to="/no-permission" replace />;
  }
  return children;
}
