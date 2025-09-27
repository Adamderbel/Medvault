import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface User {
  id: number
  wallet_address: string
  type: 'patient' | 'doctor'
  pseudonym?: string
  name?: string
  speciality?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (userData: User, token: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for existing token on app load
      const storedToken = localStorage.getItem('medvault_token')
      const storedUser = localStorage.getItem('medvault_user')
      
      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          setToken(storedToken)
          setUser(userData)
          
          // Verify token is still valid
          await verifyToken(storedToken)
        } catch (error) {
          console.error('Error parsing stored user data:', error)
          logout()
        }
      }
      
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await api.get('/auth/verify', {
        headers: { Authorization: `Bearer ${tokenToVerify}` }
      })
      
      if (response.data.success) {
        // Token is valid, update user data if needed
        const userData = response.data.data.user
        setUser(userData)
        localStorage.setItem('medvault_user', JSON.stringify(userData))
      } else {
        // Token is invalid
        logout()
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      logout()
    }
  }

  const login = (userData: User, authToken: string) => {
    setUser(userData)
    setToken(authToken)
    
    // Store in localStorage
    localStorage.setItem('medvault_token', authToken)
    localStorage.setItem('medvault_user', JSON.stringify(userData))
    
    // Set default authorization header for API calls
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
    
    toast.success(`Welcome ${userData.type === 'patient' ? userData.pseudonym : userData.name}!`)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    
    // Clear localStorage
    localStorage.removeItem('medvault_token')
    localStorage.removeItem('medvault_user')
    
    // Remove authorization header
    delete api.defaults.headers.common['Authorization']
    
    toast.success('Logged out successfully')
  }

  const isAuthenticated = !!user && !!token

  // Set authorization header if token exists
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [token])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
