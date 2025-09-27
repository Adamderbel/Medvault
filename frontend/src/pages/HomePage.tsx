import React from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { 
  HeartIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  DocumentTextIcon,
  LockClosedIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

const HomePage: React.FC = () => {
  const handleResetData = async () => {
    const confirmed = window.confirm(
      '⚠️ This will delete ALL data (patients, doctors, connections, medical records). Are you sure?'
    )
    
    if (!confirmed) return
    
    try {
      const response = await api.post('/reset/all')
      if (response.data.success) {
        toast.success('🔄 All data has been reset successfully!')
        console.log('Reset complete:', response.data.data)
      }
    } catch (error: any) {
      console.error('Reset failed:', error)
      toast.error('Failed to reset data: ' + (error.response?.data?.error || error.message))
    }
  }

  const features = [
    {
      icon: ShieldCheckIcon,
      title: 'Privacy First',
      description: 'Your medical data is encrypted and stored on the Midnight blockchain, ensuring complete privacy and security.'
    },
    {
      icon: LockClosedIcon,
      title: 'You Control Access',
      description: 'Decide exactly which doctors can see which parts of your medical record. Revoke access anytime.'
    },
    {
      icon: UserGroupIcon,
      title: 'Seamless Sharing',
      description: 'Share your medical information with healthcare providers instantly and securely through smart contracts.'
    },
    {
      icon: DocumentTextIcon,
      title: 'Complete Records',
      description: 'Store comprehensive medical records including history, vitals, lab results, and treatment plans.'
    }
  ]

  const steps = [
    {
      number: '01',
      title: 'Create Your Account',
      description: 'Sign up with your Midnight wallet connected to your Lace wallet and create a secure pseudonym for privacy protection.'
    },
    {
      number: '02',
      title: 'Upload Medical Records',
      description: 'Securely upload your medical data, which gets encrypted and stored on the blockchain.'
    },
    {
      number: '03',
      title: 'Connect with Doctors',
      description: 'Connect with doctors and approve doctor requests to control exactly which information they can access.'
    },
    {
      number: '04',
      title: 'Manage Access',
      description: 'Monitor who has access to your data and revoke permissions whenever needed.'
    }
  ]

  

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="medical-gradient text-white py-24">

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-5xl mx-auto">
            {/* Logo/Icon with glow effect */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-3xl blur-xl"></div>
                <div className="relative flex items-center justify-center w-20 h-20 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/30">
                  <HeartIcon className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-8 text-balance leading-tight">
              Your Health Data,
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Your Control
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-blue-100 text-balance max-w-4xl mx-auto leading-relaxed">
              MedVault is a privacy-focused healthcare dApp that puts you in complete control 
              of your medical records using cutting-edge blockchain technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                to="/patient/signup" 
                className="group relative bg-white text-blue-600 hover:bg-gray-50 font-bold py-5 px-10 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
              >
                <span className="text-lg">Sign Up as Patient</span>
                <HeartIcon className="w-6 h-6 ml-3 group-hover:scale-110 transition-transform duration-200" />
              </Link>
              <Link 
                to="/patient/login" 
                className="group bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 font-bold py-5 px-10 rounded-2xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm hover:shadow-2xl transform hover:-translate-y-1"
              >
                <span className="text-lg">Patient Login</span>
                <HeartIcon className="w-6 h-6 ml-3 group-hover:scale-110 transition-transform duration-200" />
              </Link>
              <Link 
                to="/doctor/login" 
                className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold py-5 px-10 rounded-2xl transition-all duration-300 border border-white/30 hover:border-white/50 hover:shadow-xl transform hover:-translate-y-1"
              >
                <span className="text-lg">Doctor Portal</span>
              </Link>
            </div>
            
            {/* Demo Reset Button */}
            <div className="mt-8 pt-8 border-t border-white/20">
              <p className="text-blue-100 text-sm mb-4">Demo Environment</p>
              
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Why Choose MedVault?
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Built on cutting-edge blockchain technology to ensure your medical data 
              remains private, secure, and under your complete control.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="text-center group hover:transform hover:-translate-y-2 transition-all duration-300">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
                    <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl mx-auto shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Get started with MedVault in four simple steps and take control 
              of your healthcare data today.
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start mb-16 last:mb-0 group">
                <div className="relative mr-8 flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
                  <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl font-bold text-2xl shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-xl leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg mr-2">
                <ShieldCheckIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MedVault</span>
            </div>
            <p className="text-gray-600 mb-4">
              Privacy-focused healthcare data management powered by Midnight blockchain
            </p>
            <p className="text-sm text-gray-500">
              Built for the Midnight and Major League Hacking Hackathon 
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
