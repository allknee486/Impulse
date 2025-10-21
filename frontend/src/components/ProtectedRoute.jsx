import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiresBudget = false }) {
  const { isAuthenticated, loading, hasBudget } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-impulse-indigo"></div>
          <p className="mt-4 text-impulse-gray">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated but doesn't have a budget, redirect to setup
  // EXCEPT if they're already on the budget setup page
  if (isAuthenticated && !hasBudget && !location.pathname.includes('/budget/setup')) {
    return <Navigate to="/budget/setup" replace />;
  }

  return children;
}