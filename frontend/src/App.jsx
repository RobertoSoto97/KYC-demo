import React, { useState, createContext, useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage    from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import KycPage      from './pages/KycPage.jsx'
import AdminPage    from './pages/AdminPage.jsx'

export const AuthContext = createContext(null)
export function useAuth() { return useContext(AuthContext) }

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (!user.admin) return <Navigate to="/dashboard" />
  return children
}

export default function App() {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('kyc_demo_user')
    return s ? JSON.parse(s) : null
  })

  const login  = (u) => { localStorage.setItem('kyc_demo_user', JSON.stringify(u)); setUser(u) }
  const logout = ()  => { localStorage.removeItem('kyc_demo_user'); setUser(null) }
  const updateUser = (u) => { localStorage.setItem('kyc_demo_user', JSON.stringify(u)); setUser(u) }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      <Routes>
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/register"  element={<RegisterPage />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/kyc"       element={<PrivateRoute><KycPage /></PrivateRoute>} />
        <Route path="/admin"     element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="*"          element={<Navigate to="/login" />} />
      </Routes>
    </AuthContext.Provider>
  )
}
