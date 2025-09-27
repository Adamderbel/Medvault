import express, { Response } from 'express';
import { database } from '../database';
import { midnightService } from '../services/midnight_service';
import { createSuccessResponse, createErrorResponse } from '../utils/helpers';

const router = express.Router();

/**
 * Reset all data - FOR DEVELOPMENT/DEMO ONLY
 * POST /api/reset/all
 */
router.post('/all', async (req, res: Response) => {
  try {
    console.log('🔄 Starting database reset...');

    // Clear all tables
    await database.run('DELETE FROM notifications');
    await database.run('DELETE FROM smart_contracts');
    await database.run('DELETE FROM patients');
    await database.run('DELETE FROM doctors');

    console.log('✅ Database tables cleared');

    // Clear mock storage
    const mockSDK = (midnightService as any).sdk as any;
    if (mockSDK && mockSDK.storage) {
      mockSDK.storage.clear();
      console.log('✅ Mock storage cleared');
    }

    // Reset auto-increment counters
    await database.run('DELETE FROM sqlite_sequence');
    console.log('✅ Auto-increment counters reset');

    res.json(createSuccessResponse(
      { message: 'All data has been reset successfully' },
      'Database and storage reset complete'
    ));

  } catch (error) {
    console.error('❌ Error resetting data:', error);
    res.status(500).json(createErrorResponse('Failed to reset data'));
  }
});

/**
 * Reset connections only (keep users)
 * POST /api/reset/connections
 */
router.post('/connections', async (req, res: Response) => {
  try {
    console.log('🔄 Resetting connections...');

    // Clear connections but keep users
    await database.run('DELETE FROM notifications');
    await database.run('DELETE FROM smart_contracts');
    await database.run('UPDATE patients SET medical_record_cid = NULL');

    console.log('✅ Connections reset, users preserved');

    // Clear mock storage
    const mockSDK2 = (midnightService as any).sdk as any;
    if (mockSDK2 && mockSDK2.storage) {
      mockSDK2.storage.clear();
      console.log('✅ Mock storage cleared');
    }

    res.json(createSuccessResponse(
      { message: 'Connections have been reset successfully' },
      'Connections reset complete, users preserved'
    ));

  } catch (error) {
    console.error('❌ Error resetting connections:', error);
    res.status(500).json(createErrorResponse('Failed to reset connections'));
  }
});

/**
 * Get current data status
 * GET /api/reset/status
 */
router.get('/status', async (req, res: Response) => {
  try {
    const [patients, doctors, contracts, notifications] = await Promise.all([
      database.all('SELECT COUNT(*) as count FROM patients'),
      database.all('SELECT COUNT(*) as count FROM doctors'),
      database.all('SELECT COUNT(*) as count FROM smart_contracts'),
      database.all('SELECT COUNT(*) as count FROM notifications')
    ]);

    const storageKeys = Array.from((midnightService as any).sdk.storage.keys());

    res.json(createSuccessResponse({
      patients: patients[0].count,
      doctors: doctors[0].count,
      contracts: contracts[0].count,
      notifications: notifications[0].count,
      storage_items: storageKeys.length,
      storage_keys: storageKeys
    }));

  } catch (error) {
    console.error('❌ Error getting status:', error);
    res.status(500).json(createErrorResponse('Failed to get status'));
  }
});

export default router;
