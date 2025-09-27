import { database } from '../database';

export interface Notification {
  id?: number;
  doctor_id: number;
  patient_id: number;
  requested_fields: string; // JSON string
  status: 'pending' | 'approved' | 'denied';
  created_at?: string;
  updated_at?: string;
}

export interface NotificationWithDetails extends Notification {
  doctor_name?: string;
  doctor_speciality?: string;
  patient_pseudonym?: string;
}

export class NotificationModel {
  static async create(notificationData: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<Notification> {
    try {
      const result = await database.run(
        'INSERT INTO notifications (doctor_id, patient_id, requested_fields, status) VALUES (?, ?, ?, ?)',
        [
          notificationData.doctor_id,
          notificationData.patient_id,
          notificationData.requested_fields,
          notificationData.status || 'pending'
        ]
      );
      
      const newNotification = await this.findById(result.lastID!);
      if (!newNotification) {
        throw new Error('Failed to create notification');
      }
      
      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<Notification | null> {
    try {
      const notification = await database.get(
        'SELECT * FROM notifications WHERE id = ?',
        [id]
      );
      return notification || null;
    } catch (error) {
      console.error('Error finding notification by ID:', error);
      throw error;
    }
  }

  static async findByPatientId(patientId: number): Promise<NotificationWithDetails[]> {
    try {
      const notifications = await database.all(`
        SELECT 
          n.*,
          d.name as doctor_name,
          d.speciality as doctor_speciality
        FROM notifications n
        JOIN doctors d ON n.doctor_id = d.id
        WHERE n.patient_id = ?
        ORDER BY n.created_at DESC
      `, [patientId]);
      
      return notifications;
    } catch (error) {
      console.error('Error finding notifications by patient ID:', error);
      throw error;
    }
  }

  static async findByDoctorId(doctorId: number): Promise<NotificationWithDetails[]> {
    try {
      const notifications = await database.all(`
        SELECT 
          n.*,
          p.pseudonym as patient_pseudonym
        FROM notifications n
        JOIN patients p ON n.patient_id = p.id
        WHERE n.doctor_id = ?
        ORDER BY n.created_at DESC
      `, [doctorId]);
      
      return notifications;
    } catch (error) {
      console.error('Error finding notifications by doctor ID:', error);
      throw error;
    }
  }

  static async updateStatus(id: number, status: 'approved' | 'denied'): Promise<Notification | null> {
    try {
      await database.run(
        'UPDATE notifications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id]
      );
      
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating notification status:', error);
      throw error;
    }
  }

  static async findPendingByDoctorAndPatient(doctorId: number, patientId: number): Promise<Notification | null> {
    try {
      const notification = await database.get(
        'SELECT * FROM notifications WHERE doctor_id = ? AND patient_id = ? AND status = "pending"',
        [doctorId, patientId]
      );
      return notification || null;
    } catch (error) {
      console.error('Error finding pending notification:', error);
      throw error;
    }
  }

  static async deleteById(id: number): Promise<boolean> {
    try {
      const result = await database.run('DELETE FROM notifications WHERE id = ?', [id]);
      return result.changes! > 0;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}
