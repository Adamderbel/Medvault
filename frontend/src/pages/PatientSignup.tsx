import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'
import { 
  UserIcon, 
  WalletIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { detectMidnightProvider } from '../utils/walletDetection'

const PatientSignup: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    pseudonym: '',
    walletAddress: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const connectLaceWallet = async () => {
    try {
      // Detect Lace wallet
      const detected = detectMidnightProvider()
      console.log('🔍 Lace detection (signup):', JSON.stringify(detected.diagnostics, null, 2))
      
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

      setFormData(prev => ({ ...prev, walletAddress: addr || '' }))
      toast.success('Lace wallet connected!', { id: 'wallet-connect' })
      
    } catch (err: any) {
      console.error('❌ Failed to connect Lace wallet:', err)
      toast.error(`Connection failed: ${err.message}`, { id: 'wallet-connect' })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateWalletAddress = (address: string): boolean => {
    // Accept both Midnight Lace shielded and Ethereum-style for demo
    const ethereumRegex = /^0x[a-fA-F0-9]{40}$/
    const midnightRegex = /^mn_shield-addr_[a-zA-Z0-9]+$/
    return ethereumRegex.test(address) || midnightRegex.test(address)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.walletAddress.trim()) {
      toast.error('Please enter your wallet address')
      return
    }

    if (!validateWalletAddress(formData.walletAddress)) {
      toast.error('Please enter a valid wallet address (mn_shield-addr_... or 0x...)')
      return
    }

    if (!formData.name.trim()) {
      toast.error('Please enter your name')
      return
    }

    if (!formData.pseudonym.trim()) {
      toast.error('Please enter a pseudonym')
      return
    }

    setIsLoading(true)
    
    try {
      // Generate challenge for the wallet address
      const challengeResponse = await authAPI.generateChallenge(formData.walletAddress)
      
      if (!challengeResponse.data.success) {
        throw new Error(challengeResponse.data.error || 'Failed to generate challenge')
      }

      const challenge = challengeResponse.data.data.challenge
      
      // Try to sign challenge with Lace wallet if available; fallback to demo signature
      let signature: string | null = null
      try {
        const detected = detectMidnightProvider()
        if (detected.provider) {
          const api = await detected.provider.enable()
          if (api.signData) {
            signature = await api.signData(formData.walletAddress, challenge)
          }
        }
      } catch (signErr) {
        console.warn('Lace signing failed, will fallback to demo signature:', signErr)
      }

      if (!signature) {
        signature = `demo_signature_${Date.now()}_${formData.walletAddress}`
      }
      
      if (!signature) {
        throw new Error('Failed to sign challenge')
      }

      // Register patient
      const signupData = {
        name: formData.name.trim(),
        pseudonym: formData.pseudonym.trim() || undefined,
        wallet_address: formData.walletAddress,
        challenge,
        signature
      }

      const response = await authAPI.patientSignup(signupData)
      
      if (response.data.success) {
        const { patient, token } = response.data.data
        
        // Login user
        login({
          id: patient.id,
          wallet_address: patient.wallet_address,
          type: 'patient',
          pseudonym: patient.pseudonym
        }, token)
        
        toast.success('Account created successfully!')
        navigate('/patient/doctors')
      } else {
        throw new Error(response.data.error || 'Registration failed')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      
      if (error.response?.status === 409) {
        toast.error('An account with this wallet address already exists')
      } else {
        toast.error(error.message || 'Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Registration</h1>
          <p className="text-gray-600">
            Join MedVault to take control of your medical records
          </p>
        </div>

        <div className="card max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mx-auto mb-4">
              <UserIcon className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Patient Account</h2>
            <p className="text-gray-600">
              Enter your details and wallet address to get started with MedVault.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address *
              </label>
              <div className="relative">
                <WalletIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="walletAddress"
                  name="walletAddress"
                  value={formData.walletAddress}
                  onChange={handleInputChange}
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
                Enter your Lace Midnight wallet address (starts with mn_shield-addr_) or a demo 0x address
              </p>
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="pseudonym" className="block text-sm font-medium text-gray-700 mb-2">
                Pseudonym *
              </label>
              <div className="relative">
                <ShieldCheckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="pseudonym"
                  name="pseudonym"
                  value={formData.pseudonym}
                  onChange={handleInputChange}
                  placeholder="Choose a pseudonym for privacy"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                This will be used to identify you to doctors while protecting your real identity
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
              Create Account
            </button>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important:</p>
                <p>Keep your wallet credentials safe. They cannot be recovered if lost.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/patient/login')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default PatientSignup
