import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { WalletProvider } from './contexts/WalletContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import PatientSignup from './pages/PatientSignup'
import PatientLogin from './pages/PatientLogin'
import PatientUpload from './pages/PatientUpload'
import PatientDoctors from './pages/PatientDoctors'
import PatientNotifications from './pages/PatientNotifications'
import DoctorLogin from './pages/DoctorLogin'
import DoctorDashboard from './pages/DoctorDashboardSimple'
import DoctorPatientView from './pages/DoctorPatientView'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <WalletProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/patient/signup" element={<PatientSignup />} />
              <Route path="/patient/login" element={<PatientLogin />} />
              <Route path="/doctor/login" element={<DoctorLogin />} />
              
              {/* Protected Patient Routes */}
              <Route 
                path="/patient/upload" 
                element={
                  <ProtectedRoute userType="patient">
                    <PatientUpload />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/patient/doctors" 
                element={
                  <ProtectedRoute userType="patient">
                    <PatientDoctors />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/patient/notifications" 
                element={
                  <ProtectedRoute userType="patient">
                    <PatientNotifications />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Doctor Routes */}
              <Route 
                path="/doctor/dashboard" 
                element={
                  <ProtectedRoute userType="doctor">
                    <DoctorDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/doctor/patient/:id" 
                element={
                  <ProtectedRoute userType="doctor">
                    <DoctorPatientView />
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 Route */}
              <Route path="*" element={
                <div className="text-center py-16">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600 mb-8">Page not found</p>
                  <a href="/" className="btn-primary">Go Home</a>
                </div>
              } />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </WalletProvider>
  )
}

export default App
