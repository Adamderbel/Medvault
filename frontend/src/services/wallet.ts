import { authAPI } from './api'

export interface Wallet {
  address: string
  publicKey: string
}

class WalletService {
  private connectedWallet: Wallet | null = null

  /**
   * Create a new wallet using the backend API
   */
  async createWallet(seed?: string): Promise<Wallet | null> {
    try {
      const response = await authAPI.createWallet(seed)
      
      if (response.data.success) {
        const wallet: Wallet = {
          address: response.data.data.address,
          publicKey: response.data.data.publicKey
        }
        
        this.connectedWallet = wallet
        return wallet
      }
      
      throw new Error(response.data.error || 'Failed to create wallet')
    } catch (error) {
      console.error('Error creating wallet:', error)
      throw error
    }
  }

  /**
   * Connect to an existing wallet
   * In a real implementation, this would integrate with Midnight wallet browser extension
   */
  async connectWallet(): Promise<Wallet | null> {
    try {
      // Check if there's a stored wallet from previous session
      const storedWallet = localStorage.getItem('medvault_wallet')
      if (storedWallet) {
        const wallet = JSON.parse(storedWallet)
        this.connectedWallet = wallet
        return wallet
      }

      // In a real implementation, this would:
      // 1. Check if Midnight wallet extension is installed
      // 2. Request connection permission from user
      // 3. Get wallet address and public key
      
      // For demo purposes, we'll return null to indicate no wallet found
      return null
    } catch (error) {
      console.error('Error connecting wallet:', error)
      throw error
    }
  }

  /**
   * Sign a message with the connected wallet
   * In a real implementation, this would use the Midnight wallet API
   */
  async signMessage(walletAddress: string, message: string): Promise<string> {
    try {
      if (!this.connectedWallet || this.connectedWallet.address !== walletAddress) {
        throw new Error('Wallet not connected or address mismatch')
      }

      // Mock signature generation for demo
      // In a real implementation, this would call the Midnight wallet to sign
      const signature = `sig_${btoa(message)}_${Date.now()}`
      
      return signature
    } catch (error) {
      console.error('Error signing message:', error)
      throw error
    }
  }

  /**
   * Get the currently connected wallet
   */
  getConnectedWallet(): Wallet | null {
    return this.connectedWallet
  }

  /**
   * Disconnect the current wallet
   */
  disconnect(): void {
    this.connectedWallet = null
    localStorage.removeItem('medvault_wallet')
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.connectedWallet !== null
  }

  /**
   * Validate wallet address format
   */
  isValidAddress(address: string): boolean {
    // Basic validation for Ethereum-style addresses
    // In production, this should match Midnight wallet address format
    const addressRegex = /^0x[a-fA-F0-9]{40}$/
    return addressRegex.test(address)
  }

  /**
   * Format wallet address for display (show first and last 4 characters)
   */
  formatAddress(address: string): string {
    if (!address || address.length < 8) {
      return address
    }
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  /**
   * Generate authentication challenge and get signature
   */
  async authenticateWallet(walletAddress: string): Promise<{ challenge: string; signature: string }> {
    try {
      // Generate challenge from backend
      const challengeResponse = await authAPI.generateChallenge(walletAddress)
      
      if (!challengeResponse.data.success) {
        throw new Error(challengeResponse.data.error || 'Failed to generate challenge')
      }
      
      const challenge = challengeResponse.data.data.challenge
      
      // Sign the challenge
      const signature = await this.signMessage(walletAddress, challenge)
      
      return { challenge, signature }
    } catch (error) {
      console.error('Error authenticating wallet:', error)
      throw error
    }
  }
}

export const walletService = new WalletService()
export default walletService
