import express, { Response } from 'express';
import { PatientModel } from '../models/patient';
import { DoctorModel } from '../models/doctor';
import { NotificationModel } from '../models/notification';
import { midnightService } from '../services/midnight_service';
import { smartContractService } from '../services/smart_contracts';
import { 
  authenticateToken, 
  AuthenticatedRequest,
  validateMedicalRecord
} from '../utils/security';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  validateRequiredFields,
  getAvailableMedicalFields,
  generateSampleMedicalRecord
} from '../utils/helpers';

const router = express.Router();

/**
 * Get patient profile
 * GET /api/patient/profile
 */
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'patient') {
      return res.status(403).json(createErrorResponse('Access denied. Patient access required.'));
    }

    const patient = await PatientModel.findById(req.user.id);
    if (!patient) {
      return res.status(404).json(createErrorResponse('Patient not found'));
    }

    res.json(createSuccessResponse({
      id: patient.id,
      pseudonym: patient.pseudonym,
      wallet_address: patient.wallet_address,
      has_medical_record: !!patient.medical_record_cid,
      medical_record_cid: patient.medical_record_cid,
      created_at: patient.created_at
    }));

  } catch (error) {
    console.error('Error getting patient profile:', error);
    res.status(500).json(createErrorResponse('Failed to get patient profile'));
  }
});

/**
 * Upload medical record
 * POST /api/patient/upload-record
 */
router.post('/upload-record', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'patient') {
      return res.status(403).json(createErrorResponse('Access denied. Patient access required.'));
    }

    const { medical_record } = req.body;

    if (!medical_record) {
      return res.status(400).json(createErrorResponse('Medical record data is required'));
    }

    // Validate medical record structure
    const validation = validateMedicalRecord(medical_record);
    if (!validation.isValid) {
      return res.status(400).json(createErrorResponse('Invalid medical record format', {
        errors: validation.errors
      }));
    }

    const patient = await PatientModel.findById(req.user.id);
    if (!patient) {
      return res.status(404).json(createErrorResponse('Patient not found'));
    }

    // Store encrypted medical record on Midnight network
    const cid = await midnightService.storeMedicalRecord(patient.wallet_address, medical_record);

    // Update patient record with CID
    const updatedPatient = await PatientModel.updateMedicalRecord(patient.id!, cid);

    res.json(createSuccessResponse({
      cid,
      patient: {
        id: updatedPatient?.id,
        pseudonym: updatedPatient?.pseudonym,
        has_medical_record: true
      }
    }, 'Medical record uploaded successfully'));

  } catch (error) {
    console.error('Error uploading medical record:', error);
    res.status(500).json(createErrorResponse('Failed to upload medical record'));
  }
});

/**
 * Get medical record
 * GET /api/patient/medical-record
 */
router.get('/medical-record', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'patient') {
      return res.status(403).json(createErrorResponse('Access denied. Patient access required.'));
    }

    const patient = await PatientModel.findById(req.user.id);
    if (!patient || !patient.medical_record_cid) {
      return res.status(404).json(createErrorResponse('Medical record not found'));
    }

    // Retrieve and decrypt medical record
    const medicalRecord = await midnightService.retrieveMedicalRecord(
      patient.wallet_address, 
      patient.medical_record_cid
    );

    res.json(createSuccessResponse({
      medical_record: medicalRecord,
      cid: patient.medical_record_cid
    }));

  } catch (error) {
    console.error('Error getting medical record:', error);
    res.status(500).json(createErrorResponse('Failed to retrieve medical record'));
  }
});

/**
 * Get all doctors
 * GET /api/patient/doctors
 */
router.get('/doctors', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'patient') {
      return res.status(403).json(createErrorResponse('Access denied. Patient access required.'));
    }

    const doctors = await DoctorModel.findAll();
    
    // Get connection status for each doctor
    const doctorsWithStatus = await Promise.all(doctors.map(async (doctor) => {
      const contract = await smartContractService.findByWallets(req.user!.wallet_address, doctor.wallet_address);
      const pendingNotification = await NotificationModel.findPendingByDoctorAndPatient(doctor.id!, req.user!.id);
      
      let status = 'none';
      if (contract && contract.status === 'active') {
        status = 'connected';
      } else if (pendingNotification) {
        status = 'pending';
      }

      return {
        id: doctor.id,
        name: doctor.name,
        speciality: doctor.speciality,
        wallet_address: doctor.wallet_address,
        connection_status: status,
        approved_fields: contract ? JSON.parse(contract.approved_fields || '[]') : []
      };
    }));

    res.json(createSuccessResponse(doctorsWithStatus));

  } catch (error) {
    console.error('Error getting doctors:', error);
    res.status(500).json(createErrorResponse('Failed to get doctors'));
  }
});

/**
 * Get notifications (doctor requests)
 * GET /api/patient/notifications
 */
router.get('/notifications', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'patient') {
      return res.status(403).json(createErrorResponse('Access denied. Patient access required.'));
    }

    const notifications = await NotificationModel.findByPatientId(req.user.id);
    
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      doctor_name: notification.doctor_name,
      doctor_speciality: notification.doctor_speciality,
      requested_fields: JSON.parse(notification.requested_fields),
      status: notification.status,
      created_at: notification.created_at,
      updated_at: notification.updated_at
    }));

    res.json(createSuccessResponse(formattedNotifications));

  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json(createErrorResponse('Failed to get notifications'));
  }
});

/**
 * Approve/Deny doctor request
 * POST /api/patient/notifications/:id/respond
 */
router.post('/notifications/:id/respond', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'patient') {
      return res.status(403).json(createErrorResponse('Access denied. Patient access required.'));
    }

    const notificationId = parseInt(req.params.id);
    const { action } = req.body; // 'approve' or 'deny'

    if (!action || !['approve', 'deny'].includes(action)) {
      return res.status(400).json(createErrorResponse('Action must be "approve" or "deny"'));
    }

    const notification = await NotificationModel.findById(notificationId);
    if (!notification) {
      return res.status(404).json(createErrorResponse('Notification not found'));
    }

    // Verify notification belongs to the patient
    if (notification.patient_id !== req.user.id) {
      return res.status(403).json(createErrorResponse('Access denied'));
    }

    // Update notification status
    const status = action === 'approve' ? 'approved' : 'denied';
    await NotificationModel.updateStatus(notificationId, status);

    if (action === 'approve') {
      // Create or update smart contract
      const patient = await PatientModel.findById(req.user.id);
      const doctor = await DoctorModel.findById(notification.doctor_id);
      
      if (patient && doctor) {
        const requestedFields = JSON.parse(notification.requested_fields);
        
        // Check if contract already exists
        const existingContract = await smartContractService.findByWallets(
          patient.wallet_address, 
          doctor.wallet_address
        );

        if (existingContract) {
          // Update existing contract
          await smartContractService.updateApprovedFields(existingContract.id!, requestedFields);
        } else {
          // Create new contract
          await smartContractService.createContract(
            patient.wallet_address,
            doctor.wallet_address,
            requestedFields
          );
        }
      }
    }

    res.json(createSuccessResponse({
      notification_id: notificationId,
      action,
      status
    }, `Request ${action}d successfully`));

  } catch (error) {
    console.error('Error responding to notification:', error);
    res.status(500).json(createErrorResponse('Failed to respond to notification'));
  }
});

/**
 * Revoke doctor access
 * POST /api/patient/revoke-access/:doctorId
 */
router.post('/revoke-access/:doctorId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'patient') {
      return res.status(403).json(createErrorResponse('Access denied. Patient access required.'));
    }

    const doctorId = parseInt(req.params.doctorId);
    
    const patient = await PatientModel.findById(req.user.id);
    const doctor = await DoctorModel.findById(doctorId);
    
    if (!patient || !doctor) {
      return res.status(404).json(createErrorResponse('Patient or doctor not found'));
    }

    // Find and revoke smart contract
    const contract = await smartContractService.findByWallets(
      patient.wallet_address, 
      doctor.wallet_address
    );

    if (!contract) {
      return res.status(404).json(createErrorResponse('No active contract found'));
    }

    await smartContractService.revokeContract(contract.id!);

    res.json(createSuccessResponse({
      doctor_id: doctorId,
      doctor_name: doctor.name
    }, 'Doctor access revoked successfully'));

  } catch (error) {
    console.error('Error revoking doctor access:', error);
    res.status(500).json(createErrorResponse('Failed to revoke doctor access'));
  }
});

/**
 * Get available medical fields
 * GET /api/patient/medical-fields
 */
router.get('/medical-fields', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'patient') {
      return res.status(403).json(createErrorResponse('Access denied. Patient access required.'));
    }

    const availableFields = getAvailableMedicalFields();
    
    res.json(createSuccessResponse({
      fields: availableFields,
      categories: {
        'Patient Info': availableFields.filter(f => f.startsWith('patientInfo')),
        'Medical History': availableFields.filter(f => f.startsWith('medicalHistory')),
        'Vitals': availableFields.filter(f => f.startsWith('vitals')),
        'Lab Results': availableFields.filter(f => f.startsWith('labResults')),
        'Current Treatment': availableFields.filter(f => f.startsWith('currentTreatment'))
      }
    }));

  } catch (error) {
    console.error('Error getting medical fields:', error);
    res.status(500).json(createErrorResponse('Failed to get medical fields'));
  }
});

/**
 * Connect with doctor (create basic connection)
 * POST /api/patient/connect-doctor
 */
router.post('/connect-doctor', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'patient') {
      return res.status(403).json(createErrorResponse('Access denied. Patient access required.'));
    }

    const { doctor_id } = req.body;

    if (!doctor_id) {
      return res.status(400).json(createErrorResponse('Doctor ID is required'));
    }

    const patient = await PatientModel.findById(req.user.id);
    if (!patient) {
      return res.status(404).json(createErrorResponse('Patient not found'));
    }

    const doctor = await DoctorModel.findById(doctor_id);
    if (!doctor) {
      return res.status(404).json(createErrorResponse('Doctor not found'));
    }

    // Check if connection already exists
    const existingContract = await smartContractService.findByWallets(
      patient.wallet_address, 
      doctor.wallet_address
    );
    
    if (existingContract) {
      return res.status(409).json(createErrorResponse('Connection already exists with this doctor'));
    }

    // Create a basic connection with no approved fields (empty array)
    // This establishes the connection but grants no data access yet
    await smartContractService.createContract(
      patient.wallet_address,
      doctor.wallet_address,
      [] // No fields approved initially
    );

    res.json(createSuccessResponse(
      { doctor_id, doctor_name: doctor.name },
      'Successfully connected with doctor. Doctor can now request access to specific fields.'
    ));

  } catch (error: any) {
    console.error('Error creating connection:', error);
    res.status(500).json(createErrorResponse('Failed to create connection'));
  }
});

/**
 * Generate sample medical record
 * POST /api/patient/generate-sample-record
 */
router.post('/generate-sample-record', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'patient') {
      return res.status(403).json(createErrorResponse('Access denied. Patient access required.'));
    }

    const patient = await PatientModel.findById(req.user.id);
    if (!patient) {
      return res.status(404).json(createErrorResponse('Patient not found'));
    }

    const sampleRecord = generateSampleMedicalRecord(patient.pseudonym);
    
    res.json(createSuccessResponse({
      medical_record: sampleRecord
    }, 'Sample medical record generated'));

  } catch (error) {
    console.error('Error generating sample record:', error);
    res.status(500).json(createErrorResponse('Failed to generate sample record'));
  }
});

export default router;
