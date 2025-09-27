import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'
import { 
  UserIcon, 
  WalletIcon, 
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const DoctorLogin: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [walletAddress, setWalletAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validateWalletAddress = (address: string): boolean => {
    // Basic validation for Ethereum-style addresses
    const addressRegex = /^0x[a-fA-F0-9]{40}$/
    return addressRegex.test(address)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!walletAddress.trim()) {
      toast.error('Please enter your wallet address')
      return
    }

    if (!validateWalletAddress(walletAddress)) {
      toast.error('Please enter a valid wallet address (0x...)')
      return
    }

    setIsLoading(true)
    
    try {
      // Generate challenge for the wallet address
      const challengeResponse = await authAPI.generateChallenge(walletAddress)
      
      if (!challengeResponse.data.success) {
        throw new Error(challengeResponse.data.error || 'Failed to generate challenge')
      }

      const challenge = challengeResponse.data.data.challenge
      
      // For demo purposes, we'll create a mock signature
      // In a real app, this would require the user to sign with their actual wallet
      const signature = `demo_signature_${Date.now()}_${walletAddress}`
      
      if (!signature) {
        throw new Error('Failed to sign challenge')
      }

      // Login doctor
      const loginData = {
        wallet_address: walletAddress,
        challenge,
        signature
      }

      const response = await authAPI.doctorLogin(loginData)
      
      if (response.data.success) {
        const { doctor, token } = response.data.data
        
        // Login user
        login({
          id: doctor.id,
          wallet_address: doctor.wallet_address,
          type: 'doctor',
          name: doctor.name,
          speciality: doctor.speciality
        }, token)
        
        toast.success('Login successful!')
        navigate('/doctor/dashboard')
      } else {
        throw new Error(response.data.error || 'Login failed')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.response?.status === 404) {
        toast.error('Doctor not found. Please check your wallet address.')
      } else {
        toast.error(error.message || 'Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Login</h1>
          <p className="text-gray-600">
            Access your MedVault doctor dashboard
          </p>
        </div>

        <div className="card max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mx-auto mb-4">
              <UserIcon className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Doctor Login</h2>
            <p className="text-gray-600">
              Enter your registered wallet address to access your account.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address *
              </label>
              <div className="relative">
                <WalletIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="walletAddress"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Enter your registered Midnight wallet address
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center"
            >
              {isLoading ? (
                <div className="loading-spinner mr-2" />
              ) : (
                <UserIcon className="w-5 h-5 mr-2" />
              )}
              Login to Dashboard
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Demo Doctor Account:</p>
                <p className="font-mono text-xs break-all">0x1234567890abcdef1234567890abcdef12345678</p>
                <p className="mt-1">Use this wallet address to test the doctor features.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            Need access?{' '}
            <button
              onClick={() => navigate('/')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Contact Administrator
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default DoctorLogin
