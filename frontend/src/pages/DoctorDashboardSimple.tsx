import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { doctorAPI } from '../services/api'
import toast from 'react-hot-toast'
import { 
  UserGroupIcon, 
  DocumentTextIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface Patient {
  id: number
  pseudonym: string
  connection_status: 'connected' | 'pending' | 'none'
  approved_fields: string[]
  created_at: string
}

interface MedicalField {
  field: string
  label: string
  category: string
}

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth()
  const [connectedPatients, setConnectedPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showDataModal, setShowDataModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [medicalFields, setMedicalFields] = useState<MedicalField[]>([])
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patientMedicalData, setPatientMedicalData] = useState<any>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch connected patients and medical fields
      const [connectedResponse, fieldsResponse] = await Promise.all([
        doctorAPI.getPatients(),
        doctorAPI.getMedicalFields()
      ])

      if (connectedResponse.data.success) {
        setConnectedPatients(connectedResponse.data.data || [])
      }

      if (fieldsResponse.data.success) {
        const fields = fieldsResponse.data.data.fields || []
        const formattedFields = fields.map((field: string) => ({
          field,
          label: formatFieldLabel(field),
          category: getFieldCategory(field)
        }))
        setMedicalFields(formattedFields)
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatFieldLabel = (field: string): string => {
    return field
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' → ')
  }

  const getFieldCategory = (field: string): string => {
    if (field.startsWith('patientInfo')) return 'Patient Info'
    if (field.startsWith('medicalHistory')) return 'Medical History'
    if (field.startsWith('vitals')) return 'Vitals'
    if (field.startsWith('labResults')) return 'Lab Results'
    if (field.startsWith('currentTreatment')) return 'Current Treatment'
    return 'Other'
  }

  const handleMakeRequest = (patient: Patient) => {
    setSelectedPatient(patient)
    setSelectedFields([])
    setShowRequestModal(true)
  }

  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    )
  }

  const handleSubmitRequest = async () => {
    if (!selectedPatient || selectedFields.length === 0) {
      toast.error('Please select at least one field')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await doctorAPI.requestAccess({
        patient_id: selectedPatient.id,
        requested_fields: selectedFields
      })

      if (response.data.success) {
        toast.success('Access request sent successfully!')
        setShowRequestModal(false)
        setSelectedPatient(null)
        setSelectedFields([])
        fetchDashboardData() // Refresh data
      }
    } catch (error: any) {
      console.error('Error submitting request:', error)
      toast.error(error.response?.data?.error || 'Failed to send request')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Doctors can only see patients who have granted them access
  // Patients initiate connections by approving doctor requests

  const handleViewDetails = async (patientId: number) => {
    try {
      console.log('Fetching medical data for patient:', patientId)
      const response = await doctorAPI.getPatientMedicalData(patientId)
      console.log('Medical data response:', response.data)
      
      if (response.data.success) {
        const { patient_pseudonym, approved_fields, medical_data } = response.data.data
        
        // Set the data and show modal
        setPatientMedicalData({
          patient_pseudonym,
          approved_fields,
          medical_data
        })
        setShowDataModal(true)
        
        toast.success('Medical data loaded successfully!')
        console.log(`Patient: ${patient_pseudonym}`)
        console.log(`Approved fields: ${approved_fields.join(', ')}`)
        console.log('Medical data:', medical_data)
      } else {
        throw new Error(response.data.error || 'Failed to load medical data')
      }
    } catch (error: any) {
      console.error('Error loading medical data:', error)
      console.error('Error details:', error.response?.data)
      toast.error(error.response?.data?.error || error.message || 'Failed to load medical data')
    }
  }

  // Doctors can only see patients they are connected with

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, Dr. {user?.name}
          </p>
        </div>

        {/* Connected Patients */}
        <div className="card mb-8">
          <div className="flex items-center mb-6">
            <UserGroupIcon className="w-6 h-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Connected Patients</h2>
            <span className="ml-2 bg-primary-100 text-primary-600 px-2 py-1 rounded-full text-sm">
              {connectedPatients.length}
            </span>
          </div>

          {connectedPatients.length > 0 ? (
            <div className="space-y-4">
              {connectedPatients.map((patient) => (
                <div key={patient.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{patient.pseudonym}</h3>
                      <p className="text-sm text-gray-500">
                        Connected on {new Date(patient.created_at).toLocaleDateString()}
                      </p>
                      {patient.approved_fields.length > 0 ? (
                        <p className="text-sm text-green-600">
                          ✓ Access to {patient.approved_fields.length} fields
                        </p>
                      ) : (
                        <p className="text-sm text-orange-600">
                          🔒 Connected - No data access yet
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {patient.approved_fields.length > 0 ? (
                        <button
                          onClick={() => handleViewDetails(patient.id)}
                          className="btn-primary flex items-center"
                        >
                          <DocumentTextIcon className="w-4 h-4 mr-2" />
                          View Details
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMakeRequest(patient)}
                          className="btn-secondary flex items-center"
                        >
                          <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                          Make Request
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No connected patients yet</p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="card">
          <div className="text-center py-8">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mx-auto mb-4">
              <PaperAirplaneIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">How It Works</h3>
            <div className="text-sm text-gray-500 space-y-1">
              <p>• Patients connect with you to establish a relationship</p>
              <p>• You can request access to specific medical fields</p>
              <p>• Patients approve or deny your requests</p>
              <p>• You can only view approved data fields</p>
              <p>• All data sharing is encrypted and secure</p>
            </div>
          </div>
        </div>
      </div>

      {/* Request Access Modal */}
      {showRequestModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Request Access - {selectedPatient.pseudonym}
                </h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                Select the medical fields you need access to. The patient will receive a notification and can approve or deny your request.
              </p>
              
              {Object.entries(
                medicalFields.reduce((acc, field) => {
                  if (!acc[field.category]) acc[field.category] = []
                  acc[field.category].push(field)
                  return acc
                }, {} as Record<string, MedicalField[]>)
              ).map(([category, fields]) => (
                <div key={category} className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <label 
                        key={field.field}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(field.field)}
                          onChange={() => handleFieldToggle(field.field)}
                          className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowRequestModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={selectedFields.length === 0 || isSubmitting}
                className="btn-primary flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Send Request ({selectedFields.length} fields)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medical Data Modal */}
      {showDataModal && patientMedicalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Medical Data - {patientMedicalData.patient_pseudonym}
                </h3>
                <button
                  onClick={() => setShowDataModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Approved fields: {patientMedicalData.approved_fields.join(', ')}
                </p>
              </div>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-6">
                {Object.entries(patientMedicalData.medical_data).map(([category, data]) => (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 capitalize">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(data as any).map(([field, value]) => (
                        <div key={field} className="flex justify-between items-start">
                          <span className="font-medium text-gray-600 capitalize">
                            {field.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-gray-800 text-right max-w-xs">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDataModal(false)}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorDashboard
