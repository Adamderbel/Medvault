# 🏥 MedVault - Privacy-First Healthcare dApp

<div align="center">

![MedVault](https://img.shields.io/badge/MedVault-Healthcare_dApp-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Midnight](https://img.shields.io/badge/Midnight-Blockchain-purple?style=for-the-badge)

**A privacy-focused healthcare dApp prototype built for hackathons, combining traditional web technologies with blockchain privacy solutions.**

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🏗️ Architecture](#-architecture) • [🔐 Privacy Features](#-privacy-features)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Privacy & Security](#-privacy--security)
- [API Documentation](#-api-documentation)
- [Lace Wallet Integration](#-lace-wallet-integration)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**MedVault** is a privacy-first healthcare dApp that empowers patients to take complete control of their medical records. Built as a Midnight hackathon prototype, it demonstrates how blockchain technology can solve real-world healthcare privacy challenges while maintaining usability and performance.

### 🌟 The Problem We Solve

- **Data Ownership**: Patients don't control their medical data
- **Privacy Concerns**: Medical records are vulnerable to breaches
- **Selective Sharing**: No granular control over what doctors can see
- **Interoperability**: Medical data is siloed across providers

### 💡 Our Solution

MedVault combines traditional web technologies with blockchain privacy solutions to create a system where:
- 🔐 **Patients own their data** - encrypted and stored securely
- 🎯 **Selective sharing** - grant doctors access to specific fields only
- 🛡️ **Privacy-first** - zero-knowledge architecture protects sensitive information
- 🌐 **Interoperable** - works across different healthcare providers

---

## ✨ Key Features

### 👤 **Patient Features**
- **🔐 Secure Registration** - Sign up with Lace Midnight wallet
- **📋 Medical Record Upload** - Store encrypted medical data on blockchain
- **📊 Dashboard** - View and manage the medical records
- **🔔 Notifications** - Get notified when doctors request access
- **👨‍⚕️ Doctor Discovery** - Find and connect with healthcare providers

### 👨‍⚕️ **Doctor Features**
- **🏥 Professional Registration** - Verify credentials and join network
- **🔍 Patient Discovery** - Find patients who've granted access
- **📋 Access Requests** - Request specific medical fields from patients
- **📊 Medical Dashboard** - View authorized patient data
- **🔐 Privacy-Compliant** - Only see data patients explicitly share

### 🔒 **Privacy & Security**
- **🌙 Midnight Integration** - Privacy-preserving blockchain storage
- **🔐 Wallet-Based Encryption** - Data encrypted with patient's private key
- **🎯 Granular Permissions** - Field-level access control
- **🛡️ Zero-Knowledge** - Doctors can't see unauthorized data
- **📝 Audit Trail** - All access logged and transparent

---

## 🛠️ Technology Stack

### **Frontend**
- **⚛️ React 18** - Modern UI framework
- **📘 TypeScript** - Type-safe development
- **🎨 Tailwind CSS** - Utility-first styling
- **🚀 Vite** - Fast build tool and dev server
- **🔗 React Router** - Client-side routing
- **🍞 React Hot Toast** - User notifications

### **Backend**
- **🟢 Node.js** - JavaScript runtime
- **📘 TypeScript** - Type-safe server development
- **⚡ Express.js** - Web application framework
- **🗄️ SQLite** - Lightweight database
- **🔐 JWT** - Authentication tokens
- **🛡️ bcrypt** - Password hashing

### **Blockchain & Privacy**
- **🌙 Midnight SDK** - Privacy-preserving blockchain 
- **🔐 Lace Wallet** - Cardano/Midnight wallet integration
- **🛡️ End-to-End Encryption** - Patient data protection
- **📝 Smart Contracts** - Access control and permissions

### **Development Tools**
- **📦 npm** - Package management
- **🔧 ESLint** - Code linting
- **🎨 Prettier** - Code formatting
- **🧪 Development Scripts** - Automated setup and testing

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **Lace Wallet** browser extension (for full functionality)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/medvault.git
cd medvault
```

### 2️⃣ Automated Setup

**Windows:**
```bash
setup.bat
```

**Linux/macOS:**
```bash
chmod +x setup.sh
./setup.sh
```

### 3️⃣ Manual Setup (Alternative)

**Backend Setup:**
```bash
cd backend
npm install
npm run dev
```

**Frontend Setup (New Terminal):**
```bash
cd frontend
npm install
npm run dev
```

### 4️⃣ Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: SQLite file in `backend/medvault.db`

### 5️⃣ Install Lace Wallet (Optional)

For full blockchain functionality:
1. Install [Lace Wallet](https://www.lace.io/) browser extension
2. Create or import a Midnight testnet wallet
3. Use "Connect Lace" feature in the app

---

## 🏗️ Architecture

### **System Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Express Backend│    │ Midnight Network│
│                 │    │                 │    │                 │
│ • Patient UI    │◄──►│ • REST API      │◄──►│ • Encrypted     │
│ • Doctor UI     │    │ • Authentication│    │   Storage       │
│ • Lace Connect  │    │ • SQLite DB     │    │ • Smart         │
│                 │    │                 │    │   Contracts     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Data Flow**

1. **Patient Registration**:
   ```
   Lace Wallet → Frontend → Backend → SQLite Database
   ```

2. **Medical Record Upload**:
   ```
   Patient Data → Encrypt (Wallet) → Midnight Network → CID → SQLite
   ```

3. **Doctor Access Request**:
   ```
   Doctor → Smart Contract → Patient Notification → Approval → Access Grant
   ```

4. **Data Retrieval**:
   ```
   SQLite (CID) → Midnight Network → Decrypt (Wallet) → Display
   ```



---

## 🔐 Privacy & Security

### **Encryption Model**

1. **Patient Data Encryption**:
   - Medical records encrypted with patient's private key
   - Only patient's wallet can decrypt their data
   - Doctors receive encrypted data they cannot read without permission

2. **Selective Sharing**:
   - Smart contracts control field-level access
   - Doctors only see explicitly authorized information

3. **Zero-Knowledge Architecture**:
   - Backend never sees unencrypted medical data
   - Database stores only encrypted CIDs (Content IDs)
   - Midnight network provides privacy-preserving storage

### **Security Features**

- **🔐 Wallet-Based Authentication** - No passwords, only cryptographic signatures
- **🛡️ JWT Tokens** - Secure API access with expiration
- **📝 Audit Logging** - All access attempts logged
- **🔒 HTTPS Enforcement** - Encrypted data transmission
- **🎯 Principle of Least Privilege** - Minimal data exposure

### **Privacy Compliance**

- **HIPAA Ready** - Designed with healthcare privacy regulations in mind
- **GDPR Compatible** - Patient data ownership and right to deletion
- **Audit Trail** - Complete access history for compliance
- **Data Minimization** - Only necessary data is processed

---



---

## 🌙 Lace Wallet Integration

### **Wallet Connection Flow**

1. **Detection**: App detects Lace Midnight wallet extension
3. **Address Extraction**: App  auto-detect wallet address

### **Supported Operations**

- **✅ Wallet Connection** - Connect to Lace Midnight wallet
- **✅ Address Detection** - Auto-fill wallet address
- **✅ Challenge Signing** - Cryptographic authentication
- **🔄 Data Encryption** - Encrypt medical records (mock implementation)



### **Troubleshooting Lace Connection**

1. **Install Lace Extension**: Download from official Lace website
2. **Enable Permissions**: Allow extension access to localhost
3. **Unlock Wallet**: Ensure Lace wallet is unlocked
4. **Check Network**: Verify you're on Midnight testnet

---

## 🛠️ Development

### **Project Structure**

```
medvault/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helper functions
│   │   └── app.ts          # Express app setup
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API clients
│   │   └── utils/          # Helper functions
│   ├── package.json
│   └── vite.config.ts
├── docs/                   # Documentation
├── .gitignore             # Git ignore rules
├── README.md              # This file
├── setup.bat              # Windows setup script
└── setup.sh               # Unix setup script
```

### **Development Commands**

**Backend:**
```bash
npm run dev          # Start development server
```

**Frontend:**
```bash
npm run dev          # Start development server
```

### **Environment Variables**

Create `.env` files in backend and frontend directories:

**Backend (.env):**
```env
PORT=5000
JWT_SECRET=your-secret-key
NODE_ENV=development
DATABASE_URL=./medvault.db
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=MedVault
```

### **Database Management**

```bash
# View database contents
sqlite3 backend/medvault.db ".tables"
sqlite3 backend/medvault.db "SELECT * FROM patients;"

# Reset database (development only)
rm backend/medvault.db
# Restart backend to recreate tables
```


---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


---

## ⚠️ Development Notes

### **Lace Wallet Limitation**
Due to having access to only one Lace wallet during development:
- **Patient accounts** use the real Lace wallet for data encryption and authentication
- **Doctor accounts** use mock wallet addresses for demonstration purposes
- Smart contracts and access control work with both real and mock addresses
- This limitation doesn't affect the core privacy and security architecture

### **Development Environment**
This project was developed with the assistance of **Windsurf IDE** and AI-powered development tools, which significantly accelerated the development process and helped implement complex blockchain integration features.

---

## 🚀 Future Improvements

### **Enhanced Wallet Integration**
- **Individual Lace Wallets** - Each doctor and patient should have their own Lace wallet
- **Multi-Wallet Support** - Support for different wallet providers beyond Lace
- **Hardware Wallet Integration** - Support for Ledger and other hardware wallets

### **AI-Powered Features**
- **Medical Chatbot** - AI assistant to help patients understand their medical records
- **Doctor Matching** - AI algorithm to match patients with the most suitable doctors based on medical history and specialization
- **Symptom Analysis** - AI-powered preliminary symptom analysis and recommendations
- **Treatment Suggestions** - AI recommendations for treatment plans based on medical history

### **Advanced Privacy Features**
- **Zero-Knowledge Proofs** - Enhanced privacy with ZK-SNARKs for medical data verification
- **Selective Disclosure** - More granular control over data sharing at the field level
- **Audit Trails** - Immutable logs of all data access and modifications
- **Data Anonymization** - Advanced techniques for research data sharing

### **Platform Enhancements**
- **Mobile Application** - Native iOS and Android apps
- **Telemedicine Integration** - Video consultations with integrated medical records
- **Lab Results Integration** - Direct integration with laboratory systems
- **Prescription Management** - Digital prescription system with pharmacy integration
- **Emergency Access** - Emergency medical information access for first responders

---

## 🙏 Acknowledgments

- **Windsurf IDE** - AI-powered development environment that accelerated development
- **Midnight Network** - Privacy-preserving blockchain technology
- **Major League Hacking** - Hackathon host and provider
- **Lace Wallet Team** - Cardano/Midnight wallet integration
- **React Community** - Amazing frontend framework
- **Node.js Community** - Powerful backend runtime

---

<div align="center">

**Built with ❤️ for healthcare privacy**

*MedVault - Empowering patients, respecting privacy, enabling healthcare innovation*

[![Made with TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Powered by React](https://img.shields.io/badge/Powered%20by-React-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Privacy First](https://img.shields.io/badge/Privacy-First-green?style=flat-square&logo=shield)](https://midnight.network/)

</div>
