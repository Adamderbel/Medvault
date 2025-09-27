import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doctorAPI, patientAPI } from '../services/api'
import RecordCard from '../components/RecordCard'
import toast from 'react-hot-toast'
import { 
  UserIcon, 
  DocumentTextIcon, 
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface PatientData {
  patient_pseudonym: string
  approved_fields: string[]
  medical_data: any
  contract_id: number
}

interface FieldSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (fields: string[]) => void
  availableFields: string[]
}

const FieldSelectionModal: React.FC<FieldSelectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableFields
}) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([])

  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    )
  }

  const handleSubmit = () => {
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field')
      return
    }
    onSubmit(selectedFields)
    setSelectedFields([])
    onClose()
  }

  const fieldCategories = {
    'Patient Info': availableFields.filter(f => f.startsWith('patientInfo')),
    'Medical History': availableFields.filter(f => f.startsWith('medicalHistory')),
    'Vitals': availableFields.filter(f => f.startsWith('vitals')),
    'Lab Results': availableFields.filter(f => f.startsWith('labResults')),
    'Current Treatment': availableFields.filter(f => f.startsWith('currentTreatment'))
  }

  const formatFieldName = (field: string) => {
    return field.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() || field
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Request Patient Data Access</h3>
          <p className="text-sm text-gray-600 mt-1">
            Select the medical fields you need access to
          </p>
        </div>
        
        <div className="p-6 max-h-96 overflow-y-auto">
          {Object.entries(fieldCategories).map(([category, fields]) => (
            fields.length > 0 && (
              <div key={category} className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
                <div className="space-y-2">
                  {fields.map(field => (
                    <label key={field} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field)}
                        onChange={() => handleFieldToggle(field)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {formatFieldName(field)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <div className="text-sm text-gray-600">
            {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex space-x-4">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn-primary">
              Send Request
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const DoctorPatientView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [availableFields] = useState([
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
  ])

  useEffect(() => {
    if (id) {
      fetchPatientData(parseInt(id))
    }
  }, [id])

  const fetchPatientData = async (patientId: number) => {
    try {
      const response = await doctorAPI.getPatientMedicalData(patientId)
      if (response.data.success) {
        setPatientData(response.data.data)
      }
    } catch (error: any) {
      console.error('Error fetching patient data:', error)
      if (error.response?.status === 403) {
        toast.error('No access to this patient\'s data')
      } else if (error.response?.status === 404) {
        toast.error('Patient not found')
        navigate('/doctor/dashboard')
      } else {
        toast.error('Failed to load patient data')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestAccess = async (selectedFields: string[]) => {
    if (!id) return

    try {
      const response = await doctorAPI.requestAccess({
        patient_id: parseInt(id),
        requested_fields: selectedFields
      })

      if (response.data.success) {
        toast.success('Access request sent to patient')
      }
    } catch (error: any) {
      console.error('Error requesting access:', error)
      toast.error(error.response?.data?.error || 'Failed to send access request')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!patientData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="btn-secondary mr-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="card text-center py-12">
          <ExclamationTriangleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Access to Patient Data</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view this patient's medical records yet.
          </p>
          <button
            onClick={() => setShowFieldModal(true)}
            className="btn-primary"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Request Access
          </button>
        </div>

        <FieldSelectionModal
          isOpen={showFieldModal}
          onClose={() => setShowFieldModal(false)}
          onSubmit={handleRequestAccess}
          availableFields={availableFields}
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="btn-secondary mr-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patientData.patient_pseudonym}'s Medical Record
            </h1>
            <p className="text-gray-600">
              Viewing {patientData.approved_fields.length} approved field(s)
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowFieldModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Request More Fields
        </button>
      </div>

      {/* Access Status */}
      <div className="card bg-secondary-50 border-secondary-200">
        <div className="flex items-start">
          <CheckCircleIcon className="w-5 h-5 text-secondary-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-secondary-900 mb-2">Active Data Access</h3>
            <p className="text-sm text-secondary-800 mb-3">
              You have been granted access to the following medical fields:
            </p>
            <div className="flex flex-wrap gap-1">
              {patientData.approved_fields.map((field, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary-100 text-secondary-800"
                >
                  {field.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Medical Record */}
      <RecordCard
        record={patientData.medical_data}
        patientPseudonym={patientData.patient_pseudonym}
        approvedFields={patientData.approved_fields}
        isLimited={true}
      />

      {/* Field Selection Modal */}
      <FieldSelectionModal
        isOpen={showFieldModal}
        onClose={() => setShowFieldModal(false)}
        onSubmit={handleRequestAccess}
        availableFields={availableFields}
      />

      {/* Help Section */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <DocumentTextIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Data Access Information:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>You can only view fields that the patient has approved</li>
              <li>Request additional fields if needed for patient care</li>
              <li>All data access is logged and auditable</li>
              <li>Patient can revoke access at any time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorPatientView
