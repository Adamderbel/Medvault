import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'
import { 
  UserIcon, 
  WalletIcon
} from '@heroicons/react/24/outline'
import { detectMidnightProvider } from '../utils/walletDetection'

// No global needed; we use detectMidnightProvider()

const PatientLogin: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [walletAddress, setWalletAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const connectLaceWallet = async () => {
    try {
      // Detect Lace wallet
      const detected = detectMidnightProvider()
      console.log('🔍 Lace detection (login):', JSON.stringify(detected.diagnostics, null, 2))
      
      if (!detected.provider) {
        toast.error('Lace Midnight wallet not found. Please make sure the extension is installed and enabled.')
        return
      }

      console.log('✅ Using wallet provider key:', detected.providerKey)
      
      // Show connecting message
      toast.loading('Connecting to Lace wallet...', { id: 'wallet-connect' })
      
      // This should trigger the Lace authorization popup
      console.log('🚀 Calling provider.enable() - Lace authorization popup should appear...')
      const api = await detected.provider.enable()
      console.log('✅ Lace authorization successful! API received:', Object.keys(api))

      // Try to get wallet address from Lace Midnight API
      let addr: string | null = null
      
      console.log('🔍 Inspecting Lace API structure...')
      console.log('API methods:', Object.keys(api))
      console.log('API state:', api.state)
      
      // Check if state contains address information
      if (api.state && typeof api.state === 'object') {
        console.log('State object:', api.state)
        
        // Look for address-like properties in state
        const stateKeys = Object.keys(api.state)
        for (const key of stateKeys) {
          const value = (api.state as any)[key]
          console.log(`State.${key}:`, value)
          
          if (typeof value === 'string' && (value.startsWith('mn_') || value.startsWith('addr'))) {
            console.log(`✅ Found address in state.${key}: ${value}`)
            addr = value
            break
          }
        }
      }
      
      // If no address found, try calling state() if it's a function
      if (!addr && typeof api.state === 'function') {
        try {
          console.log('Calling api.state()...')
          const stateResult = await api.state()
          console.log('State result:', stateResult)
          
          if (stateResult && typeof stateResult === 'object') {
            // Look for address in state result
            const stateKeys = Object.keys(stateResult)
            for (const key of stateKeys) {
              const value = stateResult[key]
              if (typeof value === 'string' && (value.startsWith('mn_') || value.startsWith('addr'))) {
                console.log(`✅ Found address in state().${key}: ${value}`)
                addr = value
                break
              }
            }
          }
        } catch (err) {
          console.warn('api.state() failed:', err)
        }
      }

      if (!addr) {
        console.log('❌ Could not auto-detect wallet address from Lace API')
        console.log('This is expected with the current Lace Midnight Preview - it focuses on transactions rather than address management.')
        
        // Show a user-friendly message and suggest manual entry
        toast.dismiss('wallet-connect')
        toast.success('✅ Lace wallet connected! Please enter your address manually or use Demo.', { duration: 5000 })
        return
      }

      setWalletAddress(addr || '')
      toast.success('Lace wallet connected!', { id: 'wallet-connect' })
      
    } catch (err: any) {
      console.error('❌ Failed to connect Lace wallet:', err)
      toast.error(`Connection failed: ${err.message}`, { id: 'wallet-connect' })
    }
  }

  const validateWalletAddress = (address: string): boolean => {
    // Accept both Midnight Lace shielded and Ethereum-style for demo
    const ethereumRegex = /^0x[a-fA-F0-9]{40}$/
    const midnightRegex = /^mn_shield-addr_[a-zA-Z0-9]+$/
    return ethereumRegex.test(address) || midnightRegex.test(address)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!walletAddress.trim()) {
      toast.error('Please enter your wallet address')
      return
    }

    if (!validateWalletAddress(walletAddress)) {
      toast.error('Please enter a valid wallet address (mn_shield-addr_... or 0x...)')
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
      
      // Try to sign with Lace wallet; fallback to demo signature
      let signature: string | null = null
      try {
        const detected = detectMidnightProvider()
        if (detected.provider) {
          const api = await detected.provider.enable()
          if (api.signData) {
            signature = await api.signData(walletAddress, challenge)
          }
        }
      } catch (signErr) {
        console.warn('Lace signing failed, falling back to demo signature:', signErr)
      }

      if (!signature) {
        signature = `demo_signature_${Date.now()}_${walletAddress}`
      }
      
      if (!signature) {
        throw new Error('Failed to sign challenge')
      }

      // Login patient
      const loginData = {
        wallet_address: walletAddress,
        challenge,
        signature
      }

      const response = await authAPI.patientLogin(loginData)
      
      if (response.data.success) {
        const { patient, token } = response.data.data
        
        // Login user
        login({
          id: patient.id,
          wallet_address: patient.wallet_address,
          type: 'patient',
          pseudonym: patient.pseudonym
        }, token)
        
        toast.success('Login successful!')
        navigate('/patient/doctors')
      } else {
        throw new Error(response.data.error || 'Login failed')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.response?.status === 404) {
        toast.error('Patient not found. Please check your wallet address or sign up.')
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Login</h1>
          <p className="text-gray-600">
            Access your MedVault patient account
          </p>
        </div>

        <div className="card max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mx-auto mb-4">
              <UserIcon className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Login</h2>
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
                  placeholder="mn_shield-addr_... or 0x..."
                  className="w-full pl-10 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <button
                  type="button"
                  onClick={connectLaceWallet}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  Connect Lace
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Enter your registered Lace Midnight wallet address (mn_shield-addr_) or demo 0x address
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
              Login to Account
            </button>
          </form>

        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/patient/signup')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default PatientLogin
