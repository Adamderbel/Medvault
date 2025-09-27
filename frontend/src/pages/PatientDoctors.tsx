import React, { useState, useEffect } from 'react'
import { patientAPI } from '../services/api'
import DoctorCard from '../components/DoctorCard'
import toast from 'react-hot-toast'
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface Doctor {
  id: number
  name: string
  speciality: string
  wallet_address: string
  connection_status: 'none' | 'pending' | 'connected'
  approved_fields?: string[]
}

const PatientDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patientProfile, setPatientProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'connected' | 'pending' | 'none'>('all')

  useEffect(() => {
    fetchDoctors()
    fetchPatientProfile()
  }, [])

  // Refresh profile when component becomes visible (e.g., user navigates back from upload)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing patient profile...')
        fetchPatientProfile()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const fetchDoctors = async () => {
    try {
      const response = await patientAPI.getDoctors()
      if (response.data.success) {
        setDoctors(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
      toast.error('Failed to load doctors')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPatientProfile = async () => {
    try {
      console.log('Fetching patient profile...')
      const response = await patientAPI.getProfile()
      console.log('Patient profile response:', response.data)
      if (response.data.success) {
        setPatientProfile(response.data.data)
        console.log('Patient profile set:', response.data.data)
        console.log('Has medical record:', response.data.data.has_medical_record)
        console.log('Medical record CID:', response.data.data.medical_record_cid)
      }
    } catch (error) {
      console.error('Error fetching patient profile:', error)
      toast.error('Failed to load patient profile')
    }
  }

  const handleConnect = async (doctorId: number) => {
    const doctor = doctors.find(d => d.id === doctorId)
    if (!doctor) return

    try {
      // Create a basic connection - no data access granted yet
      const response = await patientAPI.connectWithDoctor({
        doctor_id: doctorId
      })
      
      if (response.data.success) {
        toast.success(`Successfully connected with Dr. ${doctor.name}! They can now request access to specific fields.`)
        fetchDoctors() // Refresh the list to show connected status
      } else {
        throw new Error(response.data.error || 'Failed to connect with doctor')
      }
    } catch (error: any) {
      console.error('Error connecting with doctor:', error)
      toast.error(error.response?.data?.error || 'Failed to connect with doctor')
    }
  }

  const handleRevokeAccess = async (doctorId: number) => {
    const doctor = doctors.find(d => d.id === doctorId)
    if (!doctor) return

    const confirmed = window.confirm(
      `Are you sure you want to revoke access for Dr. ${doctor.name}? They will no longer be able to view your medical data.`
    )

    if (!confirmed) return

    try {
      const response = await patientAPI.revokeAccess(doctorId)
      if (response.data.success) {
        toast.success(`Access revoked for Dr. ${doctor.name}`)
        fetchDoctors() // Refresh the list
      }
    } catch (error: any) {
      console.error('Error revoking access:', error)
      toast.error(error.response?.data?.error || 'Failed to revoke access')
    }
  }

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.speciality.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || doctor.connection_status === filter
    
    return matchesSearch && matchesFilter
  })

  const getStatusCounts = () => {
    return {
      all: doctors.length,
      connected: doctors.filter(d => d.connection_status === 'connected').length,
      pending: doctors.filter(d => d.connection_status === 'pending').length,
      none: doctors.filter(d => d.connection_status === 'none').length
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Healthcare Providers</h1>
        <p className="text-gray-600">
          Manage your connections with healthcare providers and control access to your medical data
        </p>
      </div>

      {/* Medical Record Status */}
      {patientProfile && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentTextIcon className="w-6 h-6 text-primary-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Medical Record Status</h3>
                <p className="text-sm text-gray-600">
                  {patientProfile.has_medical_record 
                    ? 'Your medical record is uploaded and ready to share with doctors'
                    : 'No medical record uploaded yet'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {patientProfile.has_medical_record ? (
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Uploaded</span>
                </div>
              ) : (
                <button
                  onClick={() => window.location.href = '/patient/upload'}
                  className="btn-primary"
                >
                  Upload Record
                </button>
              )}
              
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search doctors by name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All', count: statusCounts.all },
              { key: 'connected', label: 'Connected', count: statusCounts.connected },
              { key: 'pending', label: 'Pending', count: statusCounts.pending },
              { key: 'none', label: 'Available', count: statusCounts.none }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  filter === key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Doctors List */}
      {filteredDoctors.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filter !== 'all' ? 'No doctors found' : 'No doctors available'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Healthcare providers will appear here once they join the platform'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onConnect={handleConnect}
              onRevokeAccess={handleRevokeAccess}
              showActions={true}
            />
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <ExclamationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">How Doctor Connections Work:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Doctors can request access to specific fields of your medical record</li>
              <li>You'll receive notifications for all access requests</li>
              <li>You can approve or deny requests to share data</li>
              <li>Connected doctors can only see the fields you've approved</li>
              <li>You can revoke access at any time</li>
            </ul>
          </div>
        </div>
      </div>

     
    </div>
  )
}

export default PatientDoctors
