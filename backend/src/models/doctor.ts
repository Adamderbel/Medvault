import { database } from '../database';

export interface Doctor {
  id?: number;
  name: string;
  speciality: string;
  wallet_address: string;
  created_at?: string;
}

export class DoctorModel {
  static async findByWalletAddress(walletAddress: string): Promise<Doctor | null> {
    try {
      const doctor = await database.get(
        'SELECT * FROM doctors WHERE wallet_address = ?',
        [walletAddress]
      );
      return doctor || null;
    } catch (error) {
      console.error('Error finding doctor by wallet address:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<Doctor | null> {
    try {
      const doctor = await database.get(
        'SELECT * FROM doctors WHERE id = ?',
        [id]
      );
      return doctor || null;
    } catch (error) {
      console.error('Error finding doctor by ID:', error);
      throw error;
    }
  }

  static async findAll(): Promise<Doctor[]> {
    try {
      const doctors = await database.all('SELECT * FROM doctors ORDER BY name');
      return doctors;
    } catch (error) {
      console.error('Error finding all doctors:', error);
      throw error;
    }
  }

  static async create(doctorData: Omit<Doctor, 'id' | 'created_at'>): Promise<Doctor> {
    try {
      const result = await database.run(
        'INSERT INTO doctors (name, speciality, wallet_address) VALUES (?, ?, ?)',
        [doctorData.name, doctorData.speciality, doctorData.wallet_address]
      );
      
      const newDoctor = await this.findById(result.lastID!);
      if (!newDoctor) {
        throw new Error('Failed to create doctor');
      }
      
      return newDoctor;
    } catch (error) {
      console.error('Error creating doctor:', error);
      throw error;
    }
  }

  static async getConnectedPatients(doctorId: number): Promise<any[]> {
    try {
      const patients = await database.all(`
        SELECT DISTINCT 
          p.id,
          p.pseudonym,
          p.wallet_address,
          p.created_at,
          CASE 
            WHEN sc.status = 'active' THEN 'connected'
            WHEN n.status = 'pending' THEN 'pending'
            ELSE 'none'
          END as connection_status
        FROM patients p
        LEFT JOIN notifications n ON p.id = n.patient_id AND n.doctor_id = ?
        LEFT JOIN smart_contracts sc ON p.wallet_address = sc.patient_wallet 
          AND sc.doctor_wallet = (SELECT wallet_address FROM doctors WHERE id = ?)
        WHERE n.id IS NOT NULL OR sc.id IS NOT NULL
        ORDER BY p.pseudonym
      `, [doctorId, doctorId]);
      
      return patients;
    } catch (error) {
      console.error('Error getting connected patients:', error);
      throw error;
    }
  }
}
