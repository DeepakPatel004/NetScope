import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth.service.js';

export default function ProtectedRoute({ children }) {
  const isAuth = authService.isAuthenticated();
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
}
