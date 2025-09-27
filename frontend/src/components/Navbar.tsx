import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useWallet } from '../contexts/WalletContext'
import { 
  HeartIcon, 
  UserIcon, 
  BellIcon, 
  Bars3Icon, 
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { wallet, disconnectWallet } = useWallet()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Hide user info on homepage - make it landing page only
  const isHomePage = location.pathname === '/'
  const showUserInfo = isAuthenticated && !isHomePage

  const handleLogout = () => {
    logout()
    disconnectWallet()
    navigate('/')
    setIsMobileMenuOpen(false)
  }

  const formatWalletAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const getNavigationItems = () => {
    if (!isAuthenticated || !user) return []

    if (user.type === 'patient') {
      return [
        { name: 'Doctors', href: '/patient/doctors', icon: UserIcon },
        { name: 'Notifications', href: '/patient/notifications', icon: BellIcon },
      ]
    } else {
      return [
        { name: 'Dashboard', href: '/doctor/dashboard', icon: HeartIcon },
      ]
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
              <ShieldCheckIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MedVault</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User Info & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {showUserInfo && user ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {user.type === 'patient' ? user.pseudonym : user.name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {user.type}
                    </div>
                  </div>
                  {wallet && (
                    <div className="text-xs text-gray-400 font-mono">
                      {formatWalletAddress(wallet.address)}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors duration-200"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/patient/signup" className="btn-primary">
                  Patient Portal
                </Link>
                <Link to="/doctor/login" className="btn-secondary">
                  Doctor Portal
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              
              {showUserInfo && user ? (
                <>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {user.type === 'patient' ? user.pseudonym : user.name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize mb-2">
                      {user.type}
                    </div>
                    {wallet && (
                      <div className="text-xs text-gray-400 font-mono mb-4">
                        {formatWalletAddress(wallet.address)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors duration-200"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <Link
                    to="/patient/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full btn-primary text-center"
                  >
                    Patient Portal
                  </Link>
                  <Link
                    to="/doctor/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full btn-secondary text-center"
                  >
                    Doctor Portal
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
