import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { midnightService } from '../services/midnight_service';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    wallet_address: string;
    type: 'patient' | 'doctor';
  };
}

/**
 * Generate JWT token for authenticated user
 */
export const generateToken = (payload: any): string => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
  return jwt.sign(payload, secret, { expiresIn: '24h' });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): any => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
  return jwt.verify(token, secret);
};

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to verify wallet signature for additional security
 */
export const verifyWalletSignature = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { signature, message } = req.body;
    const walletAddress = req.user?.wallet_address;

    if (!signature || !message || !walletAddress) {
      return res.status(400).json({ error: 'Signature, message, and wallet address required' });
    }

    const isValid = await midnightService.verifyWalletSignature(walletAddress, message, signature);
    
    if (!isValid) {
      return res.status(403).json({ error: 'Invalid wallet signature' });
    }

    next();
  } catch (error) {
    console.error('Error verifying wallet signature:', error);
    return res.status(500).json({ error: 'Failed to verify wallet signature' });
  }
};

/**
 * Generate a random challenge message for wallet authentication
 */
export const generateChallenge = (): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `MedVault Authentication Challenge: ${timestamp}-${randomString}`;
};

/**
 * Validate wallet address format
 */
export const isValidWalletAddress = (address: string): boolean => {
  // Accept both Midnight Lace shielded addresses and Ethereum-style hex for demo compatibility
  const ethereumRegex = /^0x[a-fA-F0-9]{40}$/;
  const midnightRegex = /^mn_shield-addr_[a-zA-Z0-9]+$/;
  return ethereumRegex.test(address) || midnightRegex.test(address);
};

/**
 * Sanitize input to prevent injection attacks
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>\"'%;()&+]/g, '');
};

/**
 * Rate limiting helper
 */
export const createRateLimiter = () => {
  const attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  const maxAttempts = process.env.NODE_ENV === 'production' ? 5 : 50; // More lenient in development
  const windowMs = process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 5 * 60 * 1000; // 15 min in prod, 5 min in dev

  const limiter = (identifier: string): boolean => {
    const now = Date.now();
    const userAttempts = attempts.get(identifier);

    if (!userAttempts) {
      attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset if window has passed
    if (now - userAttempts.lastAttempt > windowMs) {
      attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Check if max attempts exceeded
    if (userAttempts.count >= maxAttempts) {
      return false;
    }

    // Increment attempts
    userAttempts.count++;
    userAttempts.lastAttempt = now;
    return true;
  };

  // Add a clear function for development
  limiter.clear = () => attempts.clear();
  
  return limiter;
};

/**
 * Middleware for rate limiting
 */
export const rateLimitMiddleware = (limiter: (identifier: string) => boolean) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting in development
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }
    
    const identifier = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (!limiter(identifier)) {
      return res.status(429).json({ 
        error: 'Too many attempts. Please try again later.' 
      });
    }
    
    next();
  };
};

/**
 * Validate medical record data structure
 */
export const validateMedicalRecord = (record: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!record || typeof record !== 'object') {
    errors.push('Medical record must be a valid object');
    return { isValid: false, errors };
  }

  // Required fields
  const requiredFields = ['patientInfo', 'medicalHistory'];
  requiredFields.forEach(field => {
    if (!record[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate patient info
  if (record.patientInfo) {
    if (!record.patientInfo.dateOfBirth) {
      errors.push('Patient date of birth is required');
    }
    if (!record.patientInfo.gender) {
      errors.push('Patient gender is required');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
