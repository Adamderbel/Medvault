@echo off
echo ========================================
echo    MedVault Setup Script
echo ========================================
echo.

echo [1/6] Setting up backend dependencies...
cd backend
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
) else (
    echo Backend dependencies already installed.
)

echo.
echo [2/6] Setting up frontend dependencies...
cd ..\frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
) else (
    echo Frontend dependencies already installed.
)

echo.
echo [3/6] Setting up environment files...
cd ..\backend
if not exist .env (
    echo Creating backend .env file...
    copy .env.example .env
) else (
    echo Backend .env already exists.
)

cd ..\frontend
if not exist .env (
    echo Creating frontend .env file...
    copy .env.example .env
) else (
    echo Frontend .env already exists.
)

echo.
echo [4/6] Building backend...
cd ..\backend
call npm run build

echo.
echo [5/6] Building frontend...
cd ..\frontend
call npm run build

echo.
echo [6/6] Setup complete!
echo.
echo ========================================
echo    Next Steps:
echo ========================================
echo.
echo 1. Start the backend server:
echo    cd backend
echo    npm run dev
echo.
echo 2. In a new terminal, start the frontend:
echo    cd frontend
echo    npm run dev
echo.
echo 3. Open your browser to:
echo    http://localhost:3000
echo.
echo 4. Demo doctor account:
echo    Wallet: 0x1234567890abcdef1234567890abcdef12345678
echo    Name: Dr. Sara Johnson
echo    Specialty: Cardiologist
echo.
echo ========================================
echo    Happy coding! 🏥
echo ========================================

pause
