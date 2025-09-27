import express, { Response } from 'express';
import { NotificationModel } from '../models/notification';
import { PatientModel } from '../models/patient';
import { DoctorModel } from '../models/doctor';
import { 
  authenticateToken, 
  AuthenticatedRequest
} from '../utils/security';
import { 
  createSuccessResponse, 
  createErrorResponse
} from '../utils/helpers';

const router = express.Router();

/**
 * Get all notifications for authenticated user
 * GET /api/notifications
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(createErrorResponse('Authentication required'));
    }

    let notifications;
    
    if (req.user.type === 'patient') {
      notifications = await NotificationModel.findByPatientId(req.user.id);
    } else if (req.user.type === 'doctor') {
      notifications = await NotificationModel.findByDoctorId(req.user.id);
    } else {
      return res.status(403).json(createErrorResponse('Invalid user type'));
    }

    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      doctor_id: notification.doctor_id,
      patient_id: notification.patient_id,
      doctor_name: notification.doctor_name,
      doctor_speciality: notification.doctor_speciality,
      patient_pseudonym: notification.patient_pseudonym,
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
 * Get notification by ID
 * GET /api/notifications/:id
 */
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    const notification = await NotificationModel.findById(notificationId);
    if (!notification) {
      return res.status(404).json(createErrorResponse('Notification not found'));
    }

    // Verify user has access to this notification
    if (!req.user) {
      return res.status(401).json(createErrorResponse('Authentication required'));
    }

    const hasAccess = (req.user.type === 'patient' && notification.patient_id === req.user.id) ||
                     (req.user.type === 'doctor' && notification.doctor_id === req.user.id);
    
    if (!hasAccess) {
      return res.status(403).json(createErrorResponse('Access denied'));
    }

    // Get additional details
    let doctorInfo, patientInfo;
    
    if (req.user.type === 'patient') {
      doctorInfo = await DoctorModel.findById(notification.doctor_id);
    } else {
      patientInfo = await PatientModel.findById(notification.patient_id);
    }

    const formattedNotification = {
      id: notification.id,
      doctor_id: notification.doctor_id,
      patient_id: notification.patient_id,
      doctor_name: doctorInfo?.name,
      doctor_speciality: doctorInfo?.speciality,
      patient_pseudonym: patientInfo?.pseudonym,
      requested_fields: JSON.parse(notification.requested_fields),
      status: notification.status,
      created_at: notification.created_at,
      updated_at: notification.updated_at
    };

    res.json(createSuccessResponse(formattedNotification));

  } catch (error) {
    console.error('Error getting notification:', error);
    res.status(500).json(createErrorResponse('Failed to get notification'));
  }
});

/**
 * Get notification statistics
 * GET /api/notifications/stats
 */
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(createErrorResponse('Authentication required'));
    }

    let notifications;
    
    if (req.user.type === 'patient') {
      notifications = await NotificationModel.findByPatientId(req.user.id);
    } else if (req.user.type === 'doctor') {
      notifications = await NotificationModel.findByDoctorId(req.user.id);
    } else {
      return res.status(403).json(createErrorResponse('Invalid user type'));
    }

    const stats = {
      total: notifications.length,
      pending: notifications.filter(n => n.status === 'pending').length,
      approved: notifications.filter(n => n.status === 'approved').length,
      denied: notifications.filter(n => n.status === 'denied').length,
      recent: notifications.filter(n => {
        const createdAt = new Date(n.created_at!);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return createdAt > dayAgo;
      }).length
    };

    res.json(createSuccessResponse(stats));

  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json(createErrorResponse('Failed to get notification statistics'));
  }
});

/**
 * Mark notification as read (for future use)
 * POST /api/notifications/:id/read
 */
router.post('/:id/read', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    const notification = await NotificationModel.findById(notificationId);
    if (!notification) {
      return res.status(404).json(createErrorResponse('Notification not found'));
    }

    // Verify user has access to this notification
    if (!req.user) {
      return res.status(401).json(createErrorResponse('Authentication required'));
    }

    const hasAccess = (req.user.type === 'patient' && notification.patient_id === req.user.id) ||
                     (req.user.type === 'doctor' && notification.doctor_id === req.user.id);
    
    if (!hasAccess) {
      return res.status(403).json(createErrorResponse('Access denied'));
    }

    // For now, just return success - in a full implementation, you'd add a 'read' field to the database
    res.json(createSuccessResponse({
      notification_id: notificationId,
      read: true
    }, 'Notification marked as read'));

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json(createErrorResponse('Failed to mark notification as read'));
  }
});

/**
 * Get pending notifications count
 * GET /api/notifications/pending/count
 */
router.get('/pending/count', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(createErrorResponse('Authentication required'));
    }

    let notifications;
    
    if (req.user.type === 'patient') {
      notifications = await NotificationModel.findByPatientId(req.user.id);
    } else if (req.user.type === 'doctor') {
      notifications = await NotificationModel.findByDoctorId(req.user.id);
    } else {
      return res.status(403).json(createErrorResponse('Invalid user type'));
    }

    const pendingCount = notifications.filter(n => n.status === 'pending').length;

    res.json(createSuccessResponse({
      pending_count: pendingCount
    }));

  } catch (error) {
    console.error('Error getting pending notifications count:', error);
    res.status(500).json(createErrorResponse('Failed to get pending notifications count'));
  }
});

export default router;
