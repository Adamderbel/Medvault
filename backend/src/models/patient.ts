import { database } from '../database';

export interface Patient {
  id?: number;
  pseudonym: string;
  wallet_address: string;
  medical_record_cid?: string;
  created_at?: string;
}

export class PatientModel {
  static async findByWalletAddress(walletAddress: string): Promise<Patient | null> {
    try {
      const patient = await database.get(
        'SELECT * FROM patients WHERE wallet_address = ?',
        [walletAddress]
      );
      return patient || null;
    } catch (error) {
      console.error('Error finding patient by wallet address:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<Patient | null> {
    try {
      const patient = await database.get(
        'SELECT * FROM patients WHERE id = ?',
        [id]
      );
      return patient || null;
    } catch (error) {
      console.error('Error finding patient by ID:', error);
      throw error;
    }
  }

  static async findByPseudonym(pseudonym: string): Promise<Patient | null> {
    try {
      const patient = await database.get(
        'SELECT * FROM patients WHERE pseudonym = ?',
        [pseudonym]
      );
      return patient || null;
    } catch (error) {
      console.error('Error finding patient by pseudonym:', error);
      throw error;
    }
  }

  static async create(patientData: Omit<Patient, 'id' | 'created_at'>): Promise<Patient> {
    try {
      const result = await database.run(
        'INSERT INTO patients (pseudonym, wallet_address, medical_record_cid) VALUES (?, ?, ?)',
        [patientData.pseudonym, patientData.wallet_address, patientData.medical_record_cid || null]
      );
      
      const newPatient = await this.findById(result.lastID!);
      if (!newPatient) {
        throw new Error('Failed to create patient');
      }
      
      return newPatient;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  static async updateMedicalRecord(id: number, cid: string): Promise<Patient | null> {
    try {
      await database.run(
        'UPDATE patients SET medical_record_cid = ? WHERE id = ?',
        [cid, id]
      );
      
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating medical record:', error);
      throw error;
    }
  }

  static async findAll(): Promise<Patient[]> {
    try {
      const patients = await database.all('SELECT * FROM patients ORDER BY pseudonym');
      return patients;
    } catch (error) {
      console.error('Error finding all patients:', error);
      throw error;
    }
  }

  static async getConnectedDoctors(patientId: number): Promise<any[]> {
    try {
      const doctors = await database.all(`
        SELECT DISTINCT 
          d.id,
          d.name,
          d.speciality,
          d.wallet_address,
          CASE 
            WHEN sc.status = 'active' THEN 'connected'
            WHEN n.status = 'pending' THEN 'pending'
            WHEN n.status = 'approved' THEN 'approved'
            WHEN n.status = 'denied' THEN 'denied'
            ELSE 'none'
          END as connection_status,
          sc.approved_fields,
          n.requested_fields,
          n.id as notification_id
        FROM doctors d
        LEFT JOIN notifications n ON d.id = n.doctor_id AND n.patient_id = ?
        LEFT JOIN smart_contracts sc ON d.wallet_address = sc.doctor_wallet 
          AND sc.patient_wallet = (SELECT wallet_address FROM patients WHERE id = ?)
        WHERE n.id IS NOT NULL OR sc.id IS NOT NULL
        ORDER BY d.name
      `, [patientId, patientId]);
      
      return doctors;
    } catch (error) {
      console.error('Error getting connected doctors:', error);
      throw error;
    }
  }
}
