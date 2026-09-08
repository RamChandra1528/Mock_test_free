import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { Role } from "../types";
import { Loading } from "./ui";
export function ProtectedRoute({ role }: { role: Role }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Restoring your secure session…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role)
    return (
      <Navigate
        to={user.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard"}
        replace
      />
    );
  return <Outlet />;
}
