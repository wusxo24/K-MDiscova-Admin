import { Navigate } from 'react-router-dom';
import { getToken } from '../utils/auth';

export default function AdminProtectedRoute({ children }) {
  return getToken() ? children : <Navigate to="/admin/login" />;
}