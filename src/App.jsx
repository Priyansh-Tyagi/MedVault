import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useEffect } from 'react'
import { supabase } from './services/supabase'
import { Toaster } from 'sonner'
import { ThemeProvider } from './components/ThemeProvider'
import { TooltipProvider } from './components/ui/tooltip'
import Loading from './components/Common/Loading'

// Layouts
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import SharedRecord from './pages/SharedRecord'
import NotFound from './pages/NotFound'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <Loading message="Loading..." />
  }
  
  return user ? children : <Navigate to="/login" replace />
}

// Public Route Component (for auth pages when already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <Loading message="Loading..." />
  }
  
  return !user ? children : <Navigate to="/dashboard" replace />
}

function App() {
  // Handle auth callback from email confirmation
  useEffect(() => {
    // Check for hash params (email confirmation)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')

    if (accessToken && refreshToken && type === 'signup') {
      // Set the session
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(({ data, error }) => {
        if (error) {
          console.error('Session error:', error)
        } else {
          console.log('Email confirmed, session set:', data)
          // Clear hash and redirect to dashboard
          window.history.replaceState(null, '', window.location.pathname)
          window.location.href = '/dashboard'
        }
      })
    }
  }, [])

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster position="top-right" richColors closeButton />
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                
                {/* Auth Routes */}
                <Route element={<AuthLayout />}>
                  <Route 
                    path="login" 
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="register" 
                    element={
                      <PublicRoute>
                        <Register />
                      </PublicRoute>
                    } 
                  />
                </Route>
              </Route>

              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/upload" 
                element={
                  <ProtectedRoute>
                    <Upload />
                  </ProtectedRoute>
                } 
              />

              {/* Shared Record Route (No Auth Required) */}
              <Route 
                path="/share/:token" 
                element={<SharedRecord />} 
              />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
