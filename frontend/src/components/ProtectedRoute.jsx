import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in, but wrong role for this route — send them to their own dashboard
    const home = { admin: '/admin/dashboard', employee: '/employee/dashboard', citizen: '/citizen/home' };
    return <Navigate to={home[user.role] || '/login'} replace />;
  }

  return <Outlet />;
}