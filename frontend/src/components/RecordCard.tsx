import React, { useState } from 'react'
import { 
  DocumentTextIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CalendarIcon,
  UserIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'

interface MedicalRecord {
  patientInfo?: {
    name?: string
    dateOfBirth?: string
    gender?: string
    bloodType?: string
    allergies?: string[]
  }
  medicalHistory?: {
    conditions?: string[]
    medications?: string[]
    surgeries?: string[]
    familyHistory?: string[]
  }
  vitals?: {
    bloodPressure?: string
    heartRate?: number
    temperature?: number
    weight?: number
    height?: number
  }
  labResults?: {
    bloodWork?: any
    imaging?: string[]
    pathology?: string[]
  }
  currentTreatment?: {
    medications?: string[]
    therapies?: string[]
    followUpInstructions?: string
  }
  recordDate?: string
  lastUpdated?: string
}

interface RecordCardProps {
  record: MedicalRecord
  cid?: string
  patientPseudonym?: string
  approvedFields?: string[]
  isLimited?: boolean
}

const RecordCard: React.FC<RecordCardProps> = ({ 
  record, 
  cid, 
  patientPseudonym,
  approvedFields,
  isLimited = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const isFieldApproved = (fieldPath: string): boolean => {
    if (!isLimited || !approvedFields) return true
    return approvedFields.includes(fieldPath)
  }

  const renderFieldValue = (value: any, fieldPath: string): React.ReactNode => {
    if (!isFieldApproved(fieldPath)) {
      return <span className="text-gray-400 italic">Access not granted</span>
    }

    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <span key={index} className="badge bg-gray-100 text-gray-700">
              {item}
            </span>
          ))}
        </div>
      )
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div className="space-y-1">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="text-sm">
              <span className="font-medium text-gray-600">{key}:</span>{' '}
              <span className="text-gray-800">{String(val)}</span>
            </div>
          ))}
        </div>
      )
    }

    return <span className="text-gray-800">{String(value)}</span>
  }

  const getSummaryStats = () => {
    const stats = []
    
    if (record.patientInfo?.age || record.patientInfo?.dateOfBirth) {
      stats.push({
        icon: UserIcon,
        label: 'Patient Info',
        value: record.patientInfo.gender || 'Available'
      })
    }
    
    if (record.medicalHistory?.conditions?.length) {
      stats.push({
        icon: HeartIcon,
        label: 'Conditions',
        value: `${record.medicalHistory.conditions.length} listed`
      })
    }
    
    if (record.vitals) {
      stats.push({
        icon: HeartIcon,
        label: 'Vitals',
        value: record.vitals.bloodPressure || 'Recorded'
      })
    }

    return stats
  }

  const lastUpdated = record.lastUpdated || record.recordDate
  const timeAgo = lastUpdated ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true }) : null

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-secondary-100 rounded-lg">
            <DocumentTextIcon className="w-6 h-6 text-secondary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {patientPseudonym ? `${patientPseudonym}'s Medical Record` : 'Medical Record'}
            </h3>
            {timeAgo && (
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Updated {timeAgo}
              </p>
            )}
            {cid && (
              <p className="text-xs text-gray-400 font-mono mt-1">
                CID: {cid.substring(0, 20)}...
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-secondary text-sm"
        >
          {isExpanded ? (
            <>
              <EyeSlashIcon className="w-4 h-4 mr-1" />
              Collapse
            </>
          ) : (
            <>
              <EyeIcon className="w-4 h-4 mr-1" />
              View Details
            </>
          )}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {getSummaryStats().map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Icon className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-sm font-medium text-gray-900">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detailed View */}
      {isExpanded && (
        <div className="space-y-6 pt-4 border-t border-gray-200">
          {/* Patient Info */}
          {record.patientInfo && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Patient Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(record.patientInfo).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </label>
                    <div className="mt-1">
                      {renderFieldValue(value, `patientInfo.${key}`)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medical History */}
          {record.medicalHistory && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Medical History</h4>
              <div className="space-y-3">
                {Object.entries(record.medicalHistory).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </label>
                    <div className="mt-1">
                      {renderFieldValue(value, `medicalHistory.${key}`)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vitals */}
          {record.vitals && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Vital Signs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(record.vitals).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </label>
                    <div className="mt-1">
                      {renderFieldValue(value, `vitals.${key}`)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Treatment */}
          {record.currentTreatment && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Current Treatment</h4>
              <div className="space-y-3">
                {Object.entries(record.currentTreatment).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </label>
                    <div className="mt-1">
                      {renderFieldValue(value, `currentTreatment.${key}`)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isLimited && approvedFields && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Showing {approvedFields.length} approved field(s) only
          </p>
        </div>
      )}
    </div>
  )
}

export default RecordCard
