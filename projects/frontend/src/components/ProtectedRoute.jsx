import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth'

export default function ProtectedRoute({ role, children }) {
  const user = useAuth((state) => state.user)
  const token = useAuth((state) => state.token)
  const location = useLocation()

  if (!token || !user) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  }
  if (role && user.role !== role) {
    return <Navigate to="/" replace />
  }
  return children
}