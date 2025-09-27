import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('medvault_token')
      localStorage.removeItem('medvault_user')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

// Auth API calls
export const authAPI = {
  generateChallenge: (walletAddress: string) =>
    api.post('/auth/challenge', { wallet_address: walletAddress }),
  
  patientSignup: (data: {
    name: string
    pseudonym?: string
    wallet_address: string
    challenge: string
    signature: string
  }) => api.post('/auth/patient/signup', data),
  
  patientLogin: (data: {
    wallet_address: string
    challenge: string
    signature: string
  }) => api.post('/auth/patient/login', data),
  
  doctorLogin: (data: {
    wallet_address: string
    challenge: string
    signature: string
  }) => api.post('/auth/doctor/login', data),
  
  createWallet: (seed?: string) =>
    api.post('/auth/create-wallet', { seed }),
  
  verifyToken: () => api.get('/auth/verify'),
}

// Patient API calls
export const patientAPI = {
  getProfile: () => api.get('/patient/profile'),
  
  uploadRecord: (medicalRecord: any) =>
    api.post('/patient/upload-record', { medical_record: medicalRecord }),
  
  getMedicalRecord: () => api.get('/patient/medical-record'),
  
  getDoctors: () => api.get('/patient/doctors'),
  
  getNotifications: () => api.get('/patient/notifications'),
  
  respondToNotification: (id: number, action: 'approve' | 'deny') =>
    api.post(`/patient/notifications/${id}/respond`, { action }),
  
  revokeAccess: (doctorId: number) =>
    api.post(`/patient/revoke-access/${doctorId}`),
  
  getMedicalFields: () => api.get('/patient/medical-fields'),
  
  generateSampleRecord: () => api.post('/patient/generate-sample-record'),
  
  connectWithDoctor: (data: {
    doctor_id: number
    requested_fields?: string[]
  }) => api.post('/patient/connect-doctor', data),
}

// Doctor API calls
export const doctorAPI = {
  getProfile: () => api.get('/doctor/profile'),
  
  getPatients: () => api.get('/doctor/patients'),
  
  getAllPatients: () => api.get('/doctor/all-patients'),
  
  requestAccess: (data: {
    patient_id: number
    requested_fields: string[]
  }) => api.post('/doctor/request-access', data),
  
  getPatientMedicalData: (patientId: number) =>
    api.get(`/doctor/patient/${patientId}/medical-data`),
  
  getRequests: () => api.get('/doctor/requests'),
  
  cancelRequest: (id: number) => api.delete(`/doctor/requests/${id}`),
  
  getContracts: () => api.get('/doctor/contracts'),
  
  getMedicalFields: () => api.get('/doctor/medical-fields'),
}

// Notifications API calls
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  
  getById: (id: number) => api.get(`/notifications/${id}`),
  
  getStats: () => api.get('/notifications/stats'),
  
  markAsRead: (id: number) => api.post(`/notifications/${id}/read`),
  
  getPendingCount: () => api.get('/notifications/pending/count'),
}

export default api
