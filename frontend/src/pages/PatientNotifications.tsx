import React, { useState, useEffect } from 'react'
import { patientAPI } from '../services/api'
import NotificationCard from '../components/NotificationCard'
import toast from 'react-hot-toast'
import { 
  BellIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface Notification {
  id: number
  doctor_name: string
  doctor_speciality: string
  requested_fields: string[]
  status: 'pending' | 'approved' | 'denied'
  created_at: string
  updated_at?: string
}

const PatientNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await patientAPI.getNotifications()
      if (response.data.success) {
        setNotifications(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (notificationId: number) => {
    const notification = notifications.find(n => n.id === notificationId)
    if (!notification) return

    const confirmed = window.confirm(
      `Are you sure you want to approve access for Dr. ${notification.doctor_name}? They will be able to view the requested medical fields.`
    )

    if (!confirmed) return

    try {
      const response = await patientAPI.respondToNotification(notificationId, 'approve')
      if (response.data.success) {
        toast.success(`Access approved for Dr. ${notification.doctor_name}`)
        fetchNotifications() // Refresh the list
      }
    } catch (error: any) {
      console.error('Error approving request:', error)
      toast.error(error.response?.data?.error || 'Failed to approve request')
    }
  }

  const handleDeny = async (notificationId: number) => {
    const notification = notifications.find(n => n.id === notificationId)
    if (!notification) return

    const confirmed = window.confirm(
      `Are you sure you want to deny access for Dr. ${notification.doctor_name}?`
    )

    if (!confirmed) return

    try {
      const response = await patientAPI.respondToNotification(notificationId, 'deny')
      if (response.data.success) {
        toast.success(`Access denied for Dr. ${notification.doctor_name}`)
        fetchNotifications() // Refresh the list
      }
    } catch (error: any) {
      console.error('Error denying request:', error)
      toast.error(error.response?.data?.error || 'Failed to deny request')
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    return filter === 'all' || notification.status === filter
  })

  const getStatusCounts = () => {
    return {
      all: notifications.length,
      pending: notifications.filter(n => n.status === 'pending').length,
      approved: notifications.filter(n => n.status === 'approved').length,
      denied: notifications.filter(n => n.status === 'denied').length
    }
  }

  const statusCounts = getStatusCounts()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Requests</h1>
        <p className="text-gray-600">
          Review and manage doctor requests to access your medical data
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Requests', count: statusCounts.all, icon: BellIcon },
            { key: 'pending', label: 'Pending', count: statusCounts.pending, icon: ClockIcon },
            { key: 'approved', label: 'Approved', count: statusCounts.approved, icon: CheckCircleIcon },
            { key: 'denied', label: 'Denied', count: statusCounts.denied, icon: XCircleIcon }
          ].map(({ key, label, count, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                filter === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No access requests' : `No ${filter} requests`}
          </h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'Doctor access requests will appear here when they request to view your medical data'
              : `You have no ${filter} access requests at this time`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              userType="patient"
              onApprove={handleApprove}
              onDeny={handleDeny}
              showActions={true}
            />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {notifications.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {statusCounts.pending}
            </div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-secondary-600 mb-1">
              {statusCounts.approved}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {statusCounts.denied}
            </div>
            <div className="text-sm text-gray-600">Denied</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {statusCounts.all}
            </div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Understanding Access Requests</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• <strong>Pending:</strong> Requests awaiting your approval or denial</p>
          <p>• <strong>Approved:</strong> You've granted access to the requested medical fields</p>
          <p>• <strong>Denied:</strong> You've declined to share the requested information</p>
          <p>• You can change your mind and revoke access at any time from the Doctors page</p>
        </div>
      </div>
    </div>
  )
}

export default PatientNotifications
