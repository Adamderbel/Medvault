import React from 'react'
import { 
  UserIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: number
  doctor_name?: string
  doctor_speciality?: string
  patient_pseudonym?: string
  requested_fields: string[]
  status: 'pending' | 'approved' | 'denied'
  created_at: string
  updated_at?: string
}

interface NotificationCardProps {
  notification: Notification
  userType: 'patient' | 'doctor'
  onApprove?: (id: number) => void
  onDeny?: (id: number) => void
  onCancel?: (id: number) => void
  showActions?: boolean
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  userType,
  onApprove,
  onDeny,
  onCancel,
  showActions = true
}) => {
  const getStatusIcon = () => {
    switch (notification.status) {
      case 'approved':
        return <CheckCircleIcon className="w-5 h-5 text-secondary-600" />
      case 'denied':
        return <XCircleIcon className="w-5 h-5 text-red-600" />
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-600" />
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadge = () => {
    switch (notification.status) {
      case 'approved':
        return <span className="badge-success">Approved</span>
      case 'denied':
        return <span className="badge-danger">Denied</span>
      case 'pending':
        return <span className="badge-warning">Pending</span>
      default:
        return <span className="badge bg-gray-100 text-gray-600">Unknown</span>
    }
  }

  const getTitle = () => {
    if (userType === 'patient') {
      return `Access request from Dr. ${notification.doctor_name}`
    } else {
      return `Request to ${notification.patient_pseudonym}`
    }
  }

  const getSubtitle = () => {
    if (userType === 'patient') {
      return notification.doctor_speciality
    } else {
      return `${notification.requested_fields.length} fields requested`
    }
  }

  const formatFieldName = (field: string) => {
    return field.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() || field
  }

  const getActionButtons = () => {
    if (!showActions) return null

    if (userType === 'patient' && notification.status === 'pending') {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => onApprove?.(notification.id)}
            className="btn-success text-sm"
          >
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Approve
          </button>
          <button
            onClick={() => onDeny?.(notification.id)}
            className="btn-danger text-sm"
          >
            <XCircleIcon className="w-4 h-4 mr-1" />
            Deny
          </button>
        </div>
      )
    }

    if (userType === 'doctor' && notification.status === 'pending') {
      return (
        <button
          onClick={() => onCancel?.(notification.id)}
          className="btn-secondary text-sm"
        >
          Cancel Request
        </button>
      )
    }

    return null
  }

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })

  return (
    <div className="card-hover">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
            {getStatusIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-900">{getTitle()}</h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-gray-600 mb-2">{getSubtitle()}</p>
            <p className="text-xs text-gray-400">{timeAgo}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          {getActionButtons()}
        </div>
      </div>

      {notification.requested_fields.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Requested Fields:
          </h4>
          <div className="flex flex-wrap gap-1">
            {notification.requested_fields.slice(0, 4).map((field, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-800"
              >
                {formatFieldName(field)}
              </span>
            ))}
            {notification.requested_fields.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                +{notification.requested_fields.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {notification.status !== 'pending' && notification.updated_at && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            {notification.status === 'approved' ? 'Approved' : 'Denied'} {' '}
            {formatDistanceToNow(new Date(notification.updated_at), { addSuffix: true })}
          </p>
        </div>
      )}
    </div>
  )
}

export default NotificationCard
