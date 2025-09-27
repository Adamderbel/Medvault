import express, { Request, Response } from 'express';
import { PatientModel, Patient } from '../models/patient';
import { DoctorModel, Doctor } from '../models/doctor';
import { midnightService } from '../services/midnight_service';
import { 
  generateToken, 
  generateChallenge, 
  isValidWalletAddress, 
  sanitizeInput,
  createRateLimiter,
  rateLimitMiddleware
} from '../utils/security';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  validateRequiredFields,
  generatePseudonym
} from '../utils/helpers';

const router = express.Router();
const authLimiter = createRateLimiter();

/**
 * Generate authentication challenge for wallet
 * POST /api/auth/challenge
 */
router.post('/challenge', rateLimitMiddleware(authLimiter), async (req: Request, res: Response) => {
  try {
    const { wallet_address } = req.body;

    if (!wallet_address || !isValidWalletAddress(wallet_address)) {
      return res.status(400).json(createErrorResponse('Valid wallet address is required'));
    }

    const challenge = generateChallenge();
    
    // In production, store challenge in Redis with expiration
    // For now, we'll return it directly
    res.json(createSuccessResponse({ 
      challenge,
      expires_in: 300 // 5 minutes
    }));
  } catch (error) {
    console.error('Error generating challenge:', error);
    res.status(500).json(createErrorResponse('Failed to generate authentication challenge'));
  }
});

/**
 * Patient signup
 * POST /api/auth/patient/signup
 */
router.post('/patient/signup', rateLimitMiddleware(authLimiter), async (req: Request, res: Response) => {
  try {
    const { name, pseudonym, wallet_address, challenge, signature } = req.body;

    // Validate required fields
    const missingFields = validateRequiredFields(req.body, ['name', 'wallet_address', 'challenge', 'signature']);
    if (missingFields.length > 0) {
      return res.status(400).json(createErrorResponse(`Missing required fields: ${missingFields.join(', ')}`));
    }

    // Validate wallet address
    if (!isValidWalletAddress(wallet_address)) {
      return res.status(400).json(createErrorResponse('Invalid wallet address format'));
    }

    // Verify wallet signature
    const isValidSignature = await midnightService.verifyWalletSignature(wallet_address, challenge, signature);
    if (!isValidSignature) {
      return res.status(403).json(createErrorResponse('Invalid wallet signature'));
    }

    // Check if patient already exists
    const existingPatient = await PatientModel.findByWalletAddress(wallet_address);
    if (existingPatient) {
      return res.status(409).json(createErrorResponse('Patient with this wallet address already exists'));
    }

    // Generate pseudonym if not provided
    const finalPseudonym = pseudonym ? sanitizeInput(pseudonym) : generatePseudonym(name);

    // Check if pseudonym is already taken
    const existingPseudonym = await PatientModel.findByPseudonym(finalPseudonym);
    if (existingPseudonym) {
      return res.status(409).json(createErrorResponse('Pseudonym already taken'));
    }

    // Create patient
    const newPatient = await PatientModel.create({
      pseudonym: finalPseudonym,
      wallet_address: sanitizeInput(wallet_address)
    });

    // Generate JWT token
    const token = generateToken({
      id: newPatient.id,
      wallet_address: newPatient.wallet_address,
      type: 'patient'
    });

    res.status(201).json(createSuccessResponse({
      patient: {
        id: newPatient.id,
        pseudonym: newPatient.pseudonym,
        wallet_address: newPatient.wallet_address
      },
      token
    }, 'Patient registered successfully'));

  } catch (error) {
    console.error('Error in patient signup:', error);
    res.status(500).json(createErrorResponse('Failed to register patient'));
  }
});

/**
 * Patient login
 * POST /api/auth/patient/login
 */
router.post('/patient/login', rateLimitMiddleware(authLimiter), async (req: Request, res: Response) => {
  try {
    const { wallet_address, challenge, signature } = req.body;

    // Validate required fields
    const missingFields = validateRequiredFields(req.body, ['wallet_address', 'challenge', 'signature']);
    if (missingFields.length > 0) {
      return res.status(400).json(createErrorResponse(`Missing required fields: ${missingFields.join(', ')}`));
    }

    // Validate wallet address
    if (!isValidWalletAddress(wallet_address)) {
      return res.status(400).json(createErrorResponse('Invalid wallet address format'));
    }

    // Verify wallet signature
    const isValidSignature = await midnightService.verifyWalletSignature(wallet_address, challenge, signature);
    if (!isValidSignature) {
      return res.status(403).json(createErrorResponse('Invalid wallet signature'));
    }

    // Find patient
    const patient = await PatientModel.findByWalletAddress(wallet_address);
    if (!patient) {
      return res.status(404).json(createErrorResponse('Patient not found'));
    }

    // Generate JWT token
    const token = generateToken({
      id: patient.id,
      wallet_address: patient.wallet_address,
      type: 'patient'
    });

    res.json(createSuccessResponse({
      patient: {
        id: patient.id,
        pseudonym: patient.pseudonym,
        wallet_address: patient.wallet_address
      },
      token
    }, 'Login successful'));

  } catch (error) {
    console.error('Error in patient login:', error);
    res.status(500).json(createErrorResponse('Failed to login patient'));
  }
});

/**
 * Doctor login
 * POST /api/auth/doctor/login
 */
router.post('/doctor/login', rateLimitMiddleware(authLimiter), async (req: Request, res: Response) => {
  try {
    const { wallet_address, challenge, signature } = req.body;

    // Validate required fields
    const missingFields = validateRequiredFields(req.body, ['wallet_address', 'challenge', 'signature']);
    if (missingFields.length > 0) {
      return res.status(400).json(createErrorResponse(`Missing required fields: ${missingFields.join(', ')}`));
    }

    // Validate wallet address
    if (!isValidWalletAddress(wallet_address)) {
      return res.status(400).json(createErrorResponse('Invalid wallet address format'));
    }

    // Verify wallet signature
    const isValidSignature = await midnightService.verifyWalletSignature(wallet_address, challenge, signature);
    if (!isValidSignature) {
      return res.status(403).json(createErrorResponse('Invalid wallet signature'));
    }

    // Find doctor
    const doctor = await DoctorModel.findByWalletAddress(wallet_address);
    if (!doctor) {
      return res.status(404).json(createErrorResponse('Doctor not found. Please contact administrator.'));
    }

    // Generate JWT token
    const token = generateToken({
      id: doctor.id,
      wallet_address: doctor.wallet_address,
      type: 'doctor'
    });

    res.json(createSuccessResponse({
      doctor: {
        id: doctor.id,
        name: doctor.name,
        speciality: doctor.speciality,
        wallet_address: doctor.wallet_address
      },
      token
    }, 'Login successful'));

  } catch (error) {
    console.error('Error in doctor login:', error);
    res.status(500).json(createErrorResponse('Failed to login doctor'));
  }
});

/**
 * Create wallet (for development/testing)
 * POST /api/auth/create-wallet
 */
router.post('/create-wallet', async (req: Request, res: Response) => {
  try {
    const { seed } = req.body;
    
    const wallet = await midnightService.createWallet(seed);
    
    res.json(createSuccessResponse({
      address: wallet.address,
      publicKey: wallet.publicKey
    }, 'Wallet created successfully'));

  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json(createErrorResponse('Failed to create wallet'));
  }
});

/**
 * Verify token endpoint
 * GET /api/auth/verify
 */
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json(createErrorResponse('No token provided'));
    }

    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
    
    // Find user based on type
    let user;
    if (decoded.type === 'patient') {
      user = await PatientModel.findById(decoded.id);
    } else if (decoded.type === 'doctor') {
      user = await DoctorModel.findById(decoded.id);
    }

    if (!user) {
      return res.status(404).json(createErrorResponse('User not found'));
    }

    res.json(createSuccessResponse({
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        type: decoded.type,
        ...(decoded.type === 'patient' ? { pseudonym: (user as Patient).pseudonym } : { name: (user as Doctor).name, speciality: (user as Doctor).speciality })
      }
    }, 'Token is valid'));

  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(403).json(createErrorResponse('Invalid token'));
  }
});

export default router;
