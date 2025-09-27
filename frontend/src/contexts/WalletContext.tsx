import React, { createContext, useContext, useState, ReactNode } from 'react'
import { walletService } from '../services/wallet'
import toast from 'react-hot-toast'

interface Wallet {
  address: string
  publicKey: string
}

interface WalletContextType {
  wallet: Wallet | null
  isConnecting: boolean
  connectWallet: () => Promise<Wallet | null>
  createWallet: () => Promise<Wallet | null>
  signMessage: (message: string) => Promise<string | null>
  disconnectWallet: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

interface WalletProviderProps {
  children: ReactNode
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const connectWallet = async (): Promise<Wallet | null> => {
    setIsConnecting(true)
    try {
      // First check if there's a stored wallet
      const storedWallet = localStorage.getItem('medvault_wallet')
      if (storedWallet) {
        const walletData = JSON.parse(storedWallet)
        setWallet(walletData)
        toast.success('Wallet connected')
        return walletData
      }

      // If no stored wallet, try to connect to existing wallet
      // In a real implementation, this would integrate with actual Midnight wallet
      const connectedWallet = await walletService.connectWallet()
      if (connectedWallet) {
        setWallet(connectedWallet)
        localStorage.setItem('medvault_wallet', JSON.stringify(connectedWallet))
        toast.success('Wallet connected')
        return connectedWallet
      }

      toast.error('No wallet found. Please create a new wallet.')
      return null
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast.error('Failed to connect wallet')
      return null
    } finally {
      setIsConnecting(false)
    }
  }

  const createWallet = async (): Promise<Wallet | null> => {
    setIsConnecting(true)
    try {
      const newWallet = await walletService.createWallet()
      if (newWallet) {
        setWallet(newWallet)
        localStorage.setItem('medvault_wallet', JSON.stringify(newWallet))
        toast.success('New wallet created successfully')
        return newWallet
      }
      return null
    } catch (error) {
      console.error('Error creating wallet:', error)
      toast.error('Failed to create wallet')
      return null
    } finally {
      setIsConnecting(false)
    }
  }

  const signMessage = async (message: string): Promise<string | null> => {
    if (!wallet) {
      toast.error('No wallet connected')
      return null
    }

    try {
      const signature = await walletService.signMessage(wallet.address, message)
      return signature
    } catch (error) {
      console.error('Error signing message:', error)
      toast.error('Failed to sign message')
      return null
    }
  }

  const disconnectWallet = () => {
    setWallet(null)
    localStorage.removeItem('medvault_wallet')
    toast.success('Wallet disconnected')
  }

  const value: WalletContextType = {
    wallet,
    isConnecting,
    connectWallet,
    createWallet,
    signMessage,
    disconnectWallet
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
