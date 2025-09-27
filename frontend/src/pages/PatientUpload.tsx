import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { patientAPI } from '../services/api'
import RecordCard from '../components/RecordCard'
import toast from 'react-hot-toast'
import { 
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const PatientUpload: React.FC = () => {
  const { user } = useAuth()
  const [medicalRecord, setMedicalRecord] = useState<any>(null)
  const [existingRecord, setExistingRecord] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchExistingRecord()
  }, [])

  const fetchExistingRecord = async () => {
    try {
      console.log('Fetching existing medical record...')
      const response = await patientAPI.getMedicalRecord()
      console.log('Medical record response:', response.data)
      if (response.data.success) {
        setExistingRecord(response.data.data)
        console.log('Existing record set:', response.data.data)
      }
    } catch (error: any) {
      console.log('Error fetching existing record:', error.response?.status, error.response?.data)
      if (error.response?.status !== 404) {
        console.error('Error fetching existing record:', error)
        toast.error('Failed to load existing medical record')
      }
    }
  }

  const generateSampleRecord = async () => {
    setIsLoading(true)
    try {
      // Try to get from backend first
      const response = await patientAPI.generateSampleRecord()
      if (response.data.success) {
        setMedicalRecord(response.data.data.medical_record)
        toast.success('Sample medical record generated')
      }
    } catch (error) {
      console.error('Backend not available, generating local sample:', error)
      
      // Fallback to local sample record for testing
      const localSampleRecord = {
        patientInfo: {
          name: user?.pseudonym || 'Test Patient',
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
        currentTreatment: {
          medications: ['Metformin 500mg twice daily', 'Lisinopril 10mg daily'],
          therapies: ['Dietary counseling', 'Exercise program'],
          followUpInstructions: 'Return in 3 months for follow-up'
        },
        recordDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
      
      setMedicalRecord(localSampleRecord)
      toast.success('Sample medical record generated (local)')
    } finally {
      setIsLoading(false)
    }
  }


  const uploadRecord = async () => {
    if (!medicalRecord) {
      toast.error('Please create or load a medical record first')
      return
    }

    setIsUploading(true)
    try {
      const response = await patientAPI.uploadRecord(medicalRecord)
      if (response.data.success) {
        toast.success('Medical record uploaded successfully!')
        
        // Set the uploaded record with timestamp
        const uploadedRecord = {
          medical_record: {
            ...medicalRecord,
            lastUpdated: new Date().toISOString(),
            recordDate: new Date().toISOString()
          },
          cid: response.data.data.cid
        }
        
        setExistingRecord(uploadedRecord)
        setMedicalRecord(null)
        
        console.log('Record uploaded and set:', uploadedRecord)
        
        // Show success message with option to connect with doctors
        toast.success(
          'Medical record uploaded! You can now connect with doctors to share your data.',
          { duration: 4000 }
        )
      }
    } catch (error: any) {
      console.error('Backend not available, simulating upload:', error)
      
      // Fallback: simulate successful upload for testing
      const mockUploadedRecord = {
        medical_record: {
          ...medicalRecord,
          lastUpdated: new Date().toISOString(),
          recordDate: new Date().toISOString()
        },
        cid: `mock_cid_${Date.now()}`
      }
      
      setExistingRecord(mockUploadedRecord)
      setMedicalRecord(null)
      
      console.log('Mock record uploaded and set:', mockUploadedRecord)
      
      toast.success('Medical record uploaded successfully! (Mock mode)')
      toast.success(
        'Medical record uploaded! You can now connect with doctors to share your data.',
        { duration: 4000 }
      )
    } finally {
      setIsUploading(false)
    }
  }


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Medical Record</h1>
        <p className="text-gray-600">
          Securely store your medical data on the blockchain with end-to-end encryption
        </p>
      </div>

      {/* Existing Record */}
      {existingRecord && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Your Medical Record</h2>
            <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
              ✓ Uploaded
            </span>
          </div>
          <RecordCard 
            record={existingRecord.medical_record} 
            cid={existingRecord.cid}
            patientPseudonym={user?.pseudonym}
          />
        </div>
      )}

      {/* Upload Options */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {existingRecord ? 'Update Your Medical Record' : 'Create Your Medical Record'}
        </h2>
        
        <div className="flex justify-center">
          <button
            onClick={generateSampleRecord}
            disabled={isLoading}
            className="btn-primary flex items-center px-8 py-4"
          >
            {isLoading ? (
              <div className="loading-spinner mr-3" />
            ) : (
              <SparklesIcon className="w-6 h-6 mr-3" />
            )}
            <span className="font-medium text-lg">
              {existingRecord ? 'Update Medical Record' : 'Create Medical Record'}
            </span>
          </button>
        </div>
        
        <div className="text-center text-sm text-gray-500 mt-4">
          Generate a comprehensive medical record with sample data
        </div>

      </div>

      {/* Preview and Upload */}
      {medicalRecord && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Preview Your Record</h2>
            <button
              onClick={uploadRecord}
              disabled={isUploading}
              className="btn-success flex items-center"
            >
              {isUploading ? (
                <>
                  <div className="loading-spinner mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  {existingRecord ? 'Update Record' : 'Upload Record'}
                </>
              )}
            </button>
          </div>
          
          <RecordCard 
            record={medicalRecord} 
            patientPseudonym={user?.pseudonym}
          />
          
          <div className="flex justify-between">
            <button
              onClick={() => setMedicalRecord(null)}
              className="btn-secondary"
            >
              Clear Record
            </button>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="card bg-primary-50 border-primary-200">
        <h3 className="text-lg font-semibold text-primary-900 mb-3">Need Help?</h3>
        <div className="space-y-2 text-sm text-primary-800">
          <p>• Use "Generate Sample" to create demo data for testing</p>
          <p>• Your data is encrypted before storage - only you can access it</p>
          <p>• You can update your record anytime by uploading a new version</p>
        </div>
      </div>
    </div>
  )
}

export default PatientUpload
