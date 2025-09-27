import React from 'react'
import { 
  UserIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  LinkIcon
} from '@heroicons/react/24/outline'

interface Doctor {
  id: number
  name: string
  speciality: string
  wallet_address: string
  connection_status: 'none' | 'pending' | 'connected'
  approved_fields?: string[]
}

interface DoctorCardProps {
  doctor: Doctor
  onConnect?: (doctorId: number) => void
  onRevokeAccess?: (doctorId: number) => void
  showActions?: boolean
}

const DoctorCard: React.FC<DoctorCardProps> = ({ 
  doctor, 
  onConnect,
  onRevokeAccess, 
  showActions = true 
}) => {
  const getStatusBadge = () => {
    switch (doctor.connection_status) {
      case 'connected':
        return (
          <span className="badge-success">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Connected
          </span>
        )
      case 'pending':
        return (
          <span className="badge-warning">
            <ClockIcon className="w-3 h-3 mr-1" />
            Pending
          </span>
        )
      default:
        return (
          <span className="badge bg-gray-100 text-gray-600">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Not Connected
          </span>
        )
    }
  }

  const getActionButton = () => {
    if (!showActions) return null

    switch (doctor.connection_status) {
      case 'connected':
        return (
          <button
            onClick={() => onRevokeAccess?.(doctor.id)}
            className="btn-danger text-sm"
          >
            Revoke Access
          </button>
        )
      case 'pending':
        return (
          <button
            disabled
            className="btn-secondary text-sm opacity-50 cursor-not-allowed"
          >
            Request Pending
          </button>
        )
      default:
        return (
          <button
            onClick={() => onConnect?.(doctor.id)}
            className="btn-primary text-sm"
          >
            <LinkIcon className="w-4 h-4 mr-1" />
            Connect
          </button>
        )
    }
  }

  const formatWalletAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <div className="card-hover">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg">
            <UserIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
            <p className="text-gray-600 mb-2">{doctor.speciality}</p>
            <p className="text-xs text-gray-400 font-mono mb-3">
              {formatWalletAddress(doctor.wallet_address)}
            </p>
            <div className="flex items-center justify-between">
              {getStatusBadge()}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          {getActionButton()}
        </div>
      </div>

      {doctor.connection_status === 'connected' && doctor.approved_fields && doctor.approved_fields.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Approved Fields:</h4>
          <div className="flex flex-wrap gap-1">
            {doctor.approved_fields.slice(0, 3).map((field, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary-100 text-secondary-800"
              >
                {field.split('.').pop()}
              </span>
            ))}
            {doctor.approved_fields.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                +{doctor.approved_fields.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorCard
