// Smart Contract Service for MedVault
// Handles creation and management of privacy-preserving smart contracts

import { database } from '../database';
import { v4 as uuidv4 } from 'uuid';

export interface SmartContract {
  id?: number;
  patient_wallet: string;
  doctor_wallet: string;
  contract_address?: string;
  approved_fields: string; // JSON string array
  status: 'pending' | 'active' | 'revoked';
  created_at?: string;
  updated_at?: string;
}

export interface SmartContractWithPatient extends SmartContract {
  patient_pseudonym: string;
}

// Mock smart contract interface - in production this would use actual Midnight smart contract SDK
interface MidnightSmartContract {
  address: string;
  patientWallet: string;
  doctorWallet: string;
  approvedFields: string[];
  isActive: boolean;
  deploy(): Promise<string>;
  updateApprovedFields(fields: string[]): Promise<void>;
  revoke(): Promise<void>;
  checkAccess(doctorWallet: string, field: string): Promise<boolean>;
}

class MockSmartContract implements MidnightSmartContract {
  address: string;
  patientWallet: string;
  doctorWallet: string;
  approvedFields: string[];
  isActive: boolean;

  constructor(patientWallet: string, doctorWallet: string, approvedFields: string[] = []) {
    this.address = `contract_${uuidv4()}`;
    this.patientWallet = patientWallet;
    this.doctorWallet = doctorWallet;
    this.approvedFields = approvedFields;
    this.isActive = false;
  }

  async deploy(): Promise<string> {
    this.isActive = true;
    console.log(`Smart contract deployed at address: ${this.address}`);
    return this.address;
  }

  async updateApprovedFields(fields: string[]): Promise<void> {
    this.approvedFields = fields;
    console.log(`Smart contract ${this.address} updated with fields:`, fields);
  }

  async revoke(): Promise<void> {
    this.isActive = false;
    this.approvedFields = [];
    console.log(`Smart contract ${this.address} revoked`);
  }

  async checkAccess(doctorWallet: string, field: string): Promise<boolean> {
    return this.isActive && 
           this.doctorWallet === doctorWallet && 
           this.approvedFields.includes(field);
  }
}

export class SmartContractService {
  private contracts: Map<string, MidnightSmartContract> = new Map();

  /**
   * Create a new smart contract for patient-doctor data sharing
   */
  async createContract(
    patientWallet: string,
    doctorWallet: string,
    approvedFields: string[] = []
  ): Promise<SmartContract> {
    try {
      // Create smart contract instance
      const contract = new MockSmartContract(patientWallet, doctorWallet, approvedFields);
      
      // Deploy contract to Midnight network
      const contractAddress = await contract.deploy();
      this.contracts.set(contractAddress, contract);

      // Store contract info in database
      const result = await database.run(`
        INSERT INTO smart_contracts 
        (patient_wallet, doctor_wallet, contract_address, approved_fields, status) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        patientWallet,
        doctorWallet,
        contractAddress,
        JSON.stringify(approvedFields),
        'active'
      ]);

      const newContract = await this.findById(result.lastID!);
      if (!newContract) {
        throw new Error('Failed to create smart contract');
      }

      console.log(`Smart contract created: ${contractAddress}`);
      return newContract;
    } catch (error) {
      console.error('Error creating smart contract:', error);
      throw new Error('Failed to create smart contract');
    }
  }

  /**
   * Update approved fields in an existing contract
   */
  async updateApprovedFields(
    contractId: number,
    approvedFields: string[]
  ): Promise<SmartContract | null> {
    try {
      const contractData = await this.findById(contractId);
      if (!contractData || !contractData.contract_address) {
        throw new Error('Contract not found');
      }

      // Update smart contract on Midnight network
      const contract = this.contracts.get(contractData.contract_address);
      if (contract) {
        await contract.updateApprovedFields(approvedFields);
      }

      // Update database
      await database.run(`
        UPDATE smart_contracts 
        SET approved_fields = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [JSON.stringify(approvedFields), contractId]);

      return await this.findById(contractId);
    } catch (error) {
      console.error('Error updating smart contract:', error);
      throw new Error('Failed to update smart contract');
    }
  }

  /**
   * Revoke a smart contract
   */
  async revokeContract(contractId: number): Promise<boolean> {
    try {
      const contractData = await this.findById(contractId);
      if (!contractData || !contractData.contract_address) {
        throw new Error('Contract not found');
      }

      // Revoke smart contract on Midnight network
      const contract = this.contracts.get(contractData.contract_address);
      if (contract) {
        await contract.revoke();
      }

      // Update database
      await database.run(`
        UPDATE smart_contracts 
        SET status = 'revoked', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [contractId]);

      return true;
    } catch (error) {
      console.error('Error revoking smart contract:', error);
      throw new Error('Failed to revoke smart contract');
    }
  }

  /**
   * Check if doctor has access to specific field
   */
  async checkFieldAccess(
    patientWallet: string,
    doctorWallet: string,
    field: string
  ): Promise<boolean> {
    try {
      const contractData = await database.get(`
        SELECT * FROM smart_contracts 
        WHERE patient_wallet = ? AND doctor_wallet = ? AND status = 'active'
      `, [patientWallet, doctorWallet]);

      if (!contractData || !contractData.contract_address) {
        return false;
      }

      const contract = this.contracts.get(contractData.contract_address);
      if (!contract) {
        // Fallback to database check
        const approvedFields = JSON.parse(contractData.approved_fields || '[]');
        return approvedFields.includes(field);
      }

      return await contract.checkAccess(doctorWallet, field);
    } catch (error) {
      console.error('Error checking field access:', error);
      return false;
    }
  }

  /**
   * Get all approved fields for a doctor-patient pair
   */
  async getApprovedFields(
    patientWallet: string,
    doctorWallet: string
  ): Promise<string[]> {
    try {
      const contractData = await database.get(`
        SELECT approved_fields FROM smart_contracts 
        WHERE patient_wallet = ? AND doctor_wallet = ? AND status = 'active'
      `, [patientWallet, doctorWallet]);

      if (!contractData) {
        return [];
      }

      return JSON.parse(contractData.approved_fields || '[]');
    } catch (error) {
      console.error('Error getting approved fields:', error);
      return [];
    }
  }

  /**
   * Find contract by ID
   */
  async findById(id: number): Promise<SmartContract | null> {
    try {
      const contract = await database.get(
        'SELECT * FROM smart_contracts WHERE id = ?',
        [id]
      );
      return contract || null;
    } catch (error) {
      console.error('Error finding contract by ID:', error);
      throw error;
    }
  }

  /**
   * Find contract by patient and doctor wallets
   */
  async findByWallets(
    patientWallet: string,
    doctorWallet: string
  ): Promise<SmartContract | null> {
    try {
      const contract = await database.get(`
        SELECT * FROM smart_contracts 
        WHERE patient_wallet = ? AND doctor_wallet = ? AND status = 'active'
      `, [patientWallet, doctorWallet]);
      
      return contract || null;
    } catch (error) {
      console.error('Error finding contract by wallets:', error);
      throw error;
    }
  }

  /**
   * Get all contracts for a patient
   */
  async getPatientContracts(patientWallet: string): Promise<SmartContract[]> {
    try {
      const contracts = await database.all(`
        SELECT sc.*, d.name as doctor_name, d.speciality as doctor_speciality
        FROM smart_contracts sc
        JOIN doctors d ON sc.doctor_wallet = d.wallet_address
        WHERE sc.patient_wallet = ?
        ORDER BY sc.created_at DESC
      `, [patientWallet]);
      
      return contracts;
    } catch (error) {
      console.error('Error getting patient contracts:', error);
      throw error;
    }
  }

  /**
   * Get all contracts for a doctor
   */
  async getDoctorContracts(doctorWallet: string): Promise<SmartContractWithPatient[]> {
    try {
      const contracts = await database.all(`
        SELECT sc.*, p.pseudonym as patient_pseudonym
        FROM smart_contracts sc
        JOIN patients p ON sc.patient_wallet = p.wallet_address
        WHERE sc.doctor_wallet = ?
        ORDER BY sc.created_at DESC
      `, [doctorWallet]);
      
      return contracts;
    } catch (error) {
      console.error('Error getting doctor contracts:', error);
      throw error;
    }
  }
}

export const smartContractService = new SmartContractService();
