// Midnight SDK Integration for MedVault
// This service handles wallet operations and encrypted data storage
// NOTE: This is a mock implementation for hackathon demo purposes

import { v4 as uuidv4 } from 'uuid';

// Note: These are placeholder interfaces based on expected Midnight SDK structure
// In a real implementation, these would be imported from the actual Midnight SDK
interface MidnightWallet {
  address: string;
  publicKey: string;
  sign(data: string): Promise<string>;
  encrypt(data: string, recipientPublicKey?: string): Promise<string>;
  decrypt(encryptedData: string): Promise<string>;
}

interface MidnightStorage {
  store(data: string): Promise<string>; // Returns CID
  retrieve(cid: string): Promise<string>;
}

interface MidnightSDK {
  createWallet(seed?: string): Promise<MidnightWallet>;
  connectWallet(address: string): Promise<MidnightWallet>;
  getStorage(): MidnightStorage;
}

// Mock implementation for development - replace with actual Midnight SDK
class MockMidnightSDK implements MidnightSDK {
  private wallets: Map<string, MidnightWallet> = new Map();
  private storage: Map<string, string> = new Map();

  async createWallet(seed?: string): Promise<MidnightWallet> {
    // Generate a realistic wallet address for demo purposes
    const randomHex = () => Math.floor(Math.random() * 16).toString(16);
    const address = `0x${Array.from({length: 40}, randomHex).join('')}`;
    const publicKey = `pub_${Array.from({length: 64}, randomHex).join('')}`;
    
    const wallet: MidnightWallet = {
      address,
      publicKey,
      async sign(data: string): Promise<string> {
        return `sig_${Buffer.from(data).toString('base64')}`;
      },
      async encrypt(data: string, recipientPublicKey?: string): Promise<string> {
        const encrypted = Buffer.from(data).toString('base64');
        return `enc_${encrypted}`;
      },
      async decrypt(encryptedData: string): Promise<string> {
        const data = encryptedData.replace('enc_', '');
        return Buffer.from(data, 'base64').toString();
      }
    };
    
    this.wallets.set(address, wallet);
    return wallet;
  }

  async connectWallet(address: string): Promise<MidnightWallet> {
    let wallet = this.wallets.get(address);
    
    // If wallet doesn't exist, create it for the provided address
    if (!wallet) {
      // Create a new wallet with the provided address
      wallet = {
        address,
        publicKey: `pub_${address.substring(2, 18)}`,
        async sign(data: string): Promise<string> {
          return `sig_${Buffer.from(data).toString('base64')}`;
        },
        async encrypt(data: string, recipientPublicKey?: string): Promise<string> {
          const encrypted = Buffer.from(data).toString('base64');
          return `enc_${encrypted}`;
        },
        async decrypt(encryptedData: string): Promise<string> {
          const data = encryptedData.replace('enc_', '');
          return Buffer.from(data, 'base64').toString();
        }
      };
      this.wallets.set(address, wallet);
    }
    
    return wallet;
  }

  getStorage(): MidnightStorage {
    const self = this; // Capture reference to MidnightService instance
    return {
      store: async (data: string): Promise<string> => {
        const cid = `cid_${uuidv4()}`;
        self.storage.set(cid, data);
        return cid;
      },
      retrieve: async (cid: string): Promise<string> => {
        console.log('Attempting to retrieve CID:', cid);
        console.log('Available CIDs in storage:', Array.from(self.storage.keys()));
        let data = self.storage.get(cid);
        
        if (!data) {
          console.warn(`Data not found for CID: ${cid}, creating mock data`);
          
          // Create mock medical record data for demo purposes
          const mockRecord = {
            patientInfo: {
              name: "Demo Patient",
              dateOfBirth: "1985-06-15",
              gender: "Female",
              bloodType: "A+",
              allergies: ["Penicillin", "Shellfish"]
            },
            medicalHistory: {
              conditions: ["Hypertension", "Type 2 Diabetes"],
              medications: ["Metformin 500mg", "Lisinopril 10mg"],
              surgeries: ["Appendectomy (2010)"],
              familyHistory: ["Heart disease (father)", "Diabetes (mother)"]
            },
            vitals: {
              bloodPressure: "130/85",
              heartRate: 72,
              temperature: 98.6,
              weight: 150,
              height: 165
            },
            currentTreatment: {
              medications: ["Metformin 500mg twice daily", "Lisinopril 10mg daily"],
              therapies: ["Dietary counseling", "Exercise program"],
              followUpInstructions: "Return in 3 months for follow-up"
            },
            recordDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          
          // Create a simple encrypted version (just base64 encode for demo)
          const encryptedMockData = `enc_${Buffer.from(JSON.stringify(mockRecord)).toString('base64')}`;
          self.storage.set(cid, encryptedMockData);
          data = encryptedMockData;
          
          console.log('Mock data created and stored for CID:', cid);
        }
        
        console.log('Data retrieved successfully for CID:', cid);
        return data;
      }
    };
  }
}

export class MidnightService {
  private sdk: MidnightSDK;
  private storage: MidnightStorage;

  constructor() {
    // In production, this would initialize the actual Midnight SDK
    this.sdk = new MockMidnightSDK();
    this.storage = this.sdk.getStorage();
  }

  /**
   * Create a new Midnight wallet
   */
  async createWallet(seed?: string): Promise<{ address: string; publicKey: string }> {
    try {
      const wallet = await this.sdk.createWallet(seed);
      return {
        address: wallet.address,
        publicKey: wallet.publicKey
      };
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw new Error('Failed to create wallet');
    }
  }

  /**
   * Connect to an existing wallet
   */
  async connectWallet(address: string): Promise<MidnightWallet> {
    try {
      return await this.sdk.connectWallet(address);
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      throw new Error('Failed to connect to wallet');
    }
  }

  /**
   * Store encrypted medical record on Midnight network
   */
  async storeMedicalRecord(
    patientWalletAddress: string, 
    medicalData: any
  ): Promise<string> {
    try {
      const wallet = await this.connectWallet(patientWalletAddress);
      
      // Convert medical data to JSON string
      const jsonData = JSON.stringify(medicalData);
      
      // Encrypt the data using patient's wallet
      const encryptedData = await wallet.encrypt(jsonData);
      
      // Store encrypted data and get CID
      const cid = await this.storage.store(encryptedData);
      
      console.log(`Medical record stored with CID: ${cid}`);
      return cid;
    } catch (error) {
      console.error('Error storing medical record:', error);
      throw new Error('Failed to store medical record');
    }
  }

  /**
   * Retrieve and decrypt medical record from Midnight network
   */
  async retrieveMedicalRecord(
    patientWalletAddress: string, 
    cid: string
  ): Promise<any> {
    try {
      console.log('Retrieving medical record:', { patientWalletAddress, cid });
      
      const wallet = await this.connectWallet(patientWalletAddress);
      console.log('Wallet connected successfully');
      
      // Retrieve encrypted data using CID
      const encryptedData = await this.storage.retrieve(cid);
      console.log('Encrypted data retrieved:', encryptedData ? 'Data found' : 'No data');
      
      // Decrypt the data using patient's wallet
      const decryptedData = await wallet.decrypt(encryptedData);
      console.log('Data decrypted successfully');
      
      // Parse JSON data
      const parsedData = JSON.parse(decryptedData);
      console.log('Medical record parsed successfully');
      return parsedData;
    } catch (error) {
      console.error('Error retrieving medical record:', error);
      console.error('Error details:', error);
      throw new Error('Failed to retrieve medical record');
    }
  }

  /**
   * Get specific fields from medical record based on approved access
   */
  async getApprovedFields(
    patientWalletAddress: string,
    cid: string,
    approvedFields: string[]
  ): Promise<any> {
    try {
      console.log('Getting approved fields for:', { patientWalletAddress, cid, approvedFields });
      
      const fullRecord = await this.retrieveMedicalRecord(patientWalletAddress, cid);
      console.log('Full record retrieved:', fullRecord);
      
      // Filter only approved fields (handle nested properties)
      const filteredRecord: any = {};
      
      approvedFields.forEach(fieldPath => {
        console.log(`Processing field path: ${fieldPath}`);
        const value = this.getNestedProperty(fullRecord, fieldPath);
        console.log(`Value for ${fieldPath}:`, value);
        if (value !== undefined) {
          this.setNestedProperty(filteredRecord, fieldPath, value);
        }
      });
      
      console.log('Filtered record:', filteredRecord);
      return filteredRecord;
    } catch (error) {
      console.error('Error getting approved fields:', error);
      console.error('Error details:', error);
      throw new Error('Failed to get approved fields');
    }
  }

  /**
   * Get nested property value using dot notation (e.g., 'patientInfo.name')
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Set nested property value using dot notation (e.g., 'patientInfo.name')
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    const target = keys.reduce((current, key) => {
      if (!current[key]) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  /**
   * Verify wallet signature for authentication
   */
  async verifyWalletSignature(
    walletAddress: string,
    message: string,
    signature: string
  ): Promise<boolean> {
    try {
      // For demo purposes, accept demo signatures
      if (signature.startsWith('demo_signature_') && signature.endsWith(walletAddress)) {
        return true;
      }
      
      const wallet = await this.connectWallet(walletAddress);
      const expectedSignature = await wallet.sign(message);
      return signature === expectedSignature;
    } catch (error) {
      console.error('Error verifying wallet signature:', error);
      return false;
    }
  }

  /**
   * Generate a signature for wallet authentication
   */
  async signMessage(walletAddress: string, message: string): Promise<string> {
    try {
      const wallet = await this.connectWallet(walletAddress);
      return await wallet.sign(message);
    } catch (error) {
      console.error('Error signing message:', error);
      throw new Error('Failed to sign message');
    }
  }
}

export const midnightService = new MidnightService();
