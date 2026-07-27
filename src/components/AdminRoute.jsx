import { Navigate } from 'react-router-dom'
import { getStoredAdmin } from '../services/adminApi'

export default function AdminRoute({ children }) {
  const admin = getStoredAdmin()
  if (!admin) return <Navigate to="/admin/login" replace />
  return children
}
