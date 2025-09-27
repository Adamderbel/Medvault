import express, { Response } from 'express';
import { DoctorModel } from '../models/doctor';
import { PatientModel } from '../models/patient';
import { NotificationModel } from '../models/notification';
import { midnightService } from '../services/midnight_service';
import { smartContractService } from '../services/smart_contracts';
import { 
  authenticateToken, 
  AuthenticatedRequest
} from '../utils/security';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  validateRequiredFields,
  validateMedicalFields
} from '../utils/helpers';

const router = express.Router();

/**
 * Get doctor profile
 * GET /api/doctor/profile
 */
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'doctor') {
      return res.status(403).json(createErrorResponse('Access denied. Doctor access required.'));
    }

    const doctor = await DoctorModel.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json(createErrorResponse('Doctor not found'));
    }

    res.json(createSuccessResponse({
      id: doctor.id,
      name: doctor.name,
      speciality: doctor.speciality,
      wallet_address: doctor.wallet_address,
      created_at: doctor.created_at
    }));

  } catch (error) {
    console.error('Error getting doctor profile:', error);
    res.status(500).json(createErrorResponse('Failed to get doctor profile'));
  }
});

/**
 * Get connected patients
 * GET /api/doctor/patients
 */
router.get('/patients', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'doctor') {
      return res.status(403).json(createErrorResponse('Access denied. Doctor access required.'));
    }

    const patients = await DoctorModel.getConnectedPatients(req.user.id);
    
    // Get additional contract information
    const patientsWithDetails = await Promise.all(patients.map(async (patient) => {
      const contract = await smartContractService.findByWallets(
        patient.wallet_address, 
        req.user!.wallet_address
      );
      
      return {
        id: patient.id,
        pseudonym: patient.pseudonym,
        wallet_address: patient.wallet_address,
        connection_status: patient.connection_status,
        approved_fields: contract ? JSON.parse(contract.approved_fields || '[]') : [],
        contract_id: contract?.id,
        created_at: patient.created_at
      };
    }));

    res.json(createSuccessResponse(patientsWithDetails));

  } catch (error) {
    console.error('Error getting connected patients:', error);
    res.status(500).json(createErrorResponse('Failed to get connected patients'));
  }
});

/**
 * Get all patients (for connection requests)
 * GET /api/doctor/all-patients
 */
router.get('/all-patients', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'doctor') {
      return res.status(403).json(createErrorResponse('Access denied. Doctor access required.'));
    }

    const allPatients = await PatientModel.findAll();
    
    // Filter out patients without medical records and add connection status
    const patientsWithRecords = await Promise.all(
      allPatients
        .filter(patient => patient.medical_record_cid)
        .map(async (patient) => {
          const contract = await smartContractService.findByWallets(
            patient.wallet_address, 
            req.user!.wallet_address
          );
          
          const pendingNotification = await NotificationModel.findPendingByDoctorAndPatient(
            req.user!.id, 
            patient.id!
          );
          
          let status = 'none';
          if (contract && contract.status === 'active') {
            status = 'connected';
          } else if (pendingNotification) {
            status = 'pending';
          }

          return {
            id: patient.id,
            pseudonym: patient.pseudonym,
            connection_status: status,
            has_medical_record: true,
            created_at: patient.created_at
          };
        })
    );

    res.json(createSuccessResponse(patientsWithRecords));

  } catch (error) {
    console.error('Error getting all patients:', error);
    res.status(500).json(createErrorResponse('Failed to get patients'));
  }
});

/**
 * Request access to patient data
 * POST /api/doctor/request-access
 */
router.post('/request-access', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'doctor') {
      return res.status(403).json(createErrorResponse('Access denied. Doctor access required.'));
    }

    const { patient_id, requested_fields } = req.body;

    // Validate required fields
    const missingFields = validateRequiredFields(req.body, ['patient_id', 'requested_fields']);
    if (missingFields.length > 0) {
      return res.status(400).json(createErrorResponse(`Missing required fields: ${missingFields.join(', ')}`));
    }

    if (!Array.isArray(requested_fields) || requested_fields.length === 0) {
      return res.status(400).json(createErrorResponse('Requested fields must be a non-empty array'));
    }

    // Validate medical fields
    const fieldValidation = validateMedicalFields(requested_fields);
    if (fieldValidation.invalid.length > 0) {
      return res.status(400).json(createErrorResponse('Invalid medical fields', {
        invalid_fields: fieldValidation.invalid
      }));
    }

    // Check if patient exists
    const patient = await PatientModel.findById(patient_id);
    if (!patient) {
      return res.status(404).json(createErrorResponse('Patient not found'));
    }

    if (!patient.medical_record_cid) {
      return res.status(400).json(createErrorResponse('Patient has no medical record'));
    }

    // Check if there's already a pending request
    const existingNotification = await NotificationModel.findPendingByDoctorAndPatient(
      req.user.id, 
      patient_id
    );
    
    if (existingNotification) {
      return res.status(409).json(createErrorResponse('A request is already pending for this patient'));
    }

    // Check if connection exists (should exist for requests)
    const existingContract = await smartContractService.findByWallets(
      patient.wallet_address, 
      req.user.wallet_address
    );
    
    if (!existingContract || existingContract.status !== 'active') {
      return res.status(400).json(createErrorResponse('No connection exists with this patient. Patient must connect with you first.'));
    }

    // Create notification
    const notification = await NotificationModel.create({
      doctor_id: req.user.id,
      patient_id: patient_id,
      requested_fields: JSON.stringify(requested_fields),
      status: 'pending'
    });

    res.json(createSuccessResponse({
      notification_id: notification.id,
      patient_pseudonym: patient.pseudonym,
      requested_fields: requested_fields,
      status: 'pending'
    }, 'Access request sent to patient'));

  } catch (error) {
    console.error('Error requesting patient access:', error);
    res.status(500).json(createErrorResponse('Failed to request patient access'));
  }
});

/**
 * Get patient medical data (approved fields only)
 * GET /api/doctor/patient/:id/medical-data
 */
router.get('/patient/:id/medical-data', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'doctor') {
      return res.status(403).json(createErrorResponse('Access denied. Doctor access required.'));
    }

    const patientId = parseInt(req.params.id);
    
    const patient = await PatientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json(createErrorResponse('Patient not found'));
    }
    
    if (!patient.medical_record_cid) {
      return res.status(404).json(createErrorResponse('Patient has no medical record uploaded'));
    }
    
    console.log('Patient found:', {
      id: patient.id,
      pseudonym: patient.pseudonym,
      wallet_address: patient.wallet_address,
      medical_record_cid: patient.medical_record_cid
    });

    // Check if doctor has access
    const contract = await smartContractService.findByWallets(
      patient.wallet_address, 
      req.user.wallet_address
    );

    if (!contract || contract.status !== 'active') {
      return res.status(403).json(createErrorResponse('No active access to this patient'));
    }

    const approvedFields = JSON.parse(contract.approved_fields || '[]');
    if (approvedFields.length === 0) {
      return res.status(403).json(createErrorResponse('No approved fields for this patient'));
    }

    // Get approved medical data
    console.log('Calling getApprovedFields with:', {
      wallet_address: patient.wallet_address,
      cid: patient.medical_record_cid,
      approvedFields
    });
    
    const approvedData = await midnightService.getApprovedFields(
      patient.wallet_address,
      patient.medical_record_cid,
      approvedFields
    );
    
    console.log('Approved data retrieved:', approvedData);

    res.json(createSuccessResponse({
      patient_pseudonym: patient.pseudonym,
      approved_fields: approvedFields,
      medical_data: approvedData,
      contract_id: contract.id
    }));

  } catch (error) {
    console.error('Error getting patient medical data:', error);
    res.status(500).json(createErrorResponse('Failed to get patient medical data'));
  }
});

/**
 * Get doctor's sent requests
 * GET /api/doctor/requests
 */
router.get('/requests', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'doctor') {
      return res.status(403).json(createErrorResponse('Access denied. Doctor access required.'));
    }

    const notifications = await NotificationModel.findByDoctorId(req.user.id);
    
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      patient_pseudonym: notification.patient_pseudonym,
      requested_fields: JSON.parse(notification.requested_fields),
      status: notification.status,
      created_at: notification.created_at,
      updated_at: notification.updated_at
    }));

    res.json(createSuccessResponse(formattedNotifications));

  } catch (error) {
    console.error('Error getting doctor requests:', error);
    res.status(500).json(createErrorResponse('Failed to get doctor requests'));
  }
});

/**
 * Cancel pending request
 * DELETE /api/doctor/requests/:id
 */
router.delete('/requests/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'doctor') {
      return res.status(403).json(createErrorResponse('Access denied. Doctor access required.'));
    }

    const notificationId = parseInt(req.params.id);
    
    const notification = await NotificationModel.findById(notificationId);
    if (!notification) {
      return res.status(404).json(createErrorResponse('Request not found'));
    }

    // Verify notification belongs to the doctor
    if (notification.doctor_id !== req.user.id) {
      return res.status(403).json(createErrorResponse('Access denied'));
    }

    // Only allow canceling pending requests
    if (notification.status !== 'pending') {
      return res.status(400).json(createErrorResponse('Can only cancel pending requests'));
    }

    await NotificationModel.deleteById(notificationId);

    res.json(createSuccessResponse({
      notification_id: notificationId
    }, 'Request canceled successfully'));

  } catch (error) {
    console.error('Error canceling request:', error);
    res.status(500).json(createErrorResponse('Failed to cancel request'));
  }
});

/**
 * Get doctor's active contracts
 * GET /api/doctor/contracts
 */
router.get('/contracts', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'doctor') {
      return res.status(403).json(createErrorResponse('Access denied. Doctor access required.'));
    }

    const contracts = await smartContractService.getDoctorContracts(req.user.wallet_address);
    
    const formattedContracts = contracts.map(contract => ({
      id: contract.id,
      patient_pseudonym: contract.patient_pseudonym,
      approved_fields: JSON.parse(contract.approved_fields || '[]'),
      status: contract.status,
      created_at: contract.created_at,
      updated_at: contract.updated_at
    }));

    res.json(createSuccessResponse(formattedContracts));

  } catch (error) {
    console.error('Error getting doctor contracts:', error);
    res.status(500).json(createErrorResponse('Failed to get doctor contracts'));
  }
});

/**
 * Get available medical fields for requests
 * GET /api/doctor/medical-fields
 */
router.get('/medical-fields', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.type !== 'doctor') {
      return res.status(403).json(createErrorResponse('Access denied. Doctor access required.'));
    }

    const { getAvailableMedicalFields } = require('../utils/helpers');
    const availableFields = getAvailableMedicalFields();
    
    res.json(createSuccessResponse({
      fields: availableFields,
      categories: {
        'Patient Info': availableFields.filter((f: string) => f.startsWith('patientInfo')),
        'Medical History': availableFields.filter((f: string) => f.startsWith('medicalHistory')),
        'Vitals': availableFields.filter((f: string) => f.startsWith('vitals')),
        'Lab Results': availableFields.filter((f: string) => f.startsWith('labResults')),
        'Current Treatment': availableFields.filter((f: string) => f.startsWith('currentTreatment'))
      }
    }));

  } catch (error) {
    console.error('Error getting medical fields:', error);
    res.status(500).json(createErrorResponse('Failed to get medical fields'));
  }
});

export default router;
