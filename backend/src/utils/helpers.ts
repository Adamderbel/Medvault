/**
 * Helper utility functions for MedVault backend
 */

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Create success response
 */
export const createSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => {
  return {
    success: true,
    data,
    message
  };
};

/**
 * Create error response
 */
export const createErrorResponse = (error: string, data?: any): ApiResponse => {
  return {
    success: false,
    error,
    data
  };
};

/**
 * Format date to ISO string
 */
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parse medical record fields from request
 */
export const parseMedicalFields = (fieldsString: string): string[] => {
  try {
    const fields = JSON.parse(fieldsString);
    if (Array.isArray(fields)) {
      return fields.filter(field => typeof field === 'string' && field.trim().length > 0);
    }
    return [];
  } catch (error) {
    console.error('Error parsing medical fields:', error);
    return [];
  }
};

/**
 * Validate required fields in request body
 */
export const validateRequiredFields = (body: any, requiredFields: string[]): string[] => {
  const missingFields: string[] = [];
  
  requiredFields.forEach(field => {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      missingFields.push(field);
    }
  });
  
  return missingFields;
};

/**
 * Generate pseudonym from name (for privacy)
 */
export const generatePseudonym = (name: string): string => {
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return `${words[0].charAt(0).toUpperCase()}***`;
  }
  
  const firstInitial = words[0].charAt(0).toUpperCase();
  const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${firstInitial}${lastInitial}${randomSuffix}`;
};

/**
 * Mask sensitive data for logging
 */
export const maskSensitiveData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const masked = { ...data };
  const sensitiveFields = ['wallet_address', 'medical_record_cid', 'signature'];
  
  sensitiveFields.forEach(field => {
    if (masked[field]) {
      const value = masked[field].toString();
      masked[field] = value.length > 8 
        ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
        : '***';
    }
  });
  
  return masked;
};

/**
 * Convert database row to camelCase object
 */
export const toCamelCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  
  const camelCaseObj: any = {};
  Object.keys(obj).forEach(key => {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    camelCaseObj[camelKey] = toCamelCase(obj[key]);
  });
  
  return camelCaseObj;
};

/**
 * Convert camelCase object to snake_case for database
 */
export const toSnakeCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  
  const snakeCaseObj: any = {};
  Object.keys(obj).forEach(key => {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    snakeCaseObj[snakeKey] = toSnakeCase(obj[key]);
  });
  
  return snakeCaseObj;
};

/**
 * Get available medical record fields for selection
 */
export const getAvailableMedicalFields = (): string[] => {
  return [
    'patientInfo.name',
    'patientInfo.dateOfBirth',
    'patientInfo.gender',
    'patientInfo.bloodType',
    'patientInfo.allergies',
    'medicalHistory.conditions',
    'medicalHistory.medications',
    'medicalHistory.surgeries',
    'medicalHistory.familyHistory',
    'vitals.bloodPressure',
    'vitals.heartRate',
    'vitals.temperature',
    'vitals.weight',
    'vitals.height',
    'labResults.bloodWork',
    'labResults.imaging',
    'labResults.pathology',
    'currentTreatment.medications',
    'currentTreatment.therapies',
    'currentTreatment.followUpInstructions'
  ];
};

/**
 * Validate medical field names
 */
export const validateMedicalFields = (fields: string[]): { valid: string[]; invalid: string[] } => {
  const availableFields = getAvailableMedicalFields();
  const valid: string[] = [];
  const invalid: string[] = [];
  
  fields.forEach(field => {
    if (availableFields.includes(field)) {
      valid.push(field);
    } else {
      invalid.push(field);
    }
  });
  
  return { valid, invalid };
};

/**
 * Generate sample medical record for testing
 */
export const generateSampleMedicalRecord = (patientName: string): any => {
  return {
    patientInfo: {
      name: patientName,
      dateOfBirth: '1985-06-15',
      gender: 'Female',
      bloodType: 'A+',
      allergies: ['Penicillin', 'Shellfish']
    },
    medicalHistory: {
      conditions: ['Hypertension', 'Type 2 Diabetes'],
      medications: ['Metformin 500mg', 'Lisinopril 10mg'],
      surgeries: ['Appendectomy (2010)'],
      familyHistory: ['Heart disease (father)', 'Diabetes (mother)']
    },
    vitals: {
      bloodPressure: '130/85',
      heartRate: 72,
      temperature: 98.6,
      weight: 150,
      height: 165
    },
    labResults: {
      bloodWork: {
        glucose: 120,
        cholesterol: 180,
        hemoglobin: 12.5
      },
      imaging: ['Chest X-ray (normal)', 'ECG (normal)'],
      pathology: []
    },
    currentTreatment: {
      medications: ['Metformin 500mg twice daily', 'Lisinopril 10mg daily'],
      therapies: ['Dietary counseling', 'Exercise program'],
      followUpInstructions: 'Return in 3 months for follow-up'
    },
    recordDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Delay function for rate limiting or testing
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate unique identifier
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
