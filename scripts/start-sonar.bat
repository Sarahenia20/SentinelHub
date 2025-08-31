@echo off
echo 🔍 Starting SonarQube with Docker...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo 📦 Starting SonarQube and PostgreSQL containers...
docker-compose -f docker-compose.sonar.yml up -d

echo ⏳ Waiting for SonarQube to be ready...
timeout /t 30

echo 🌐 SonarQube should be available at:
echo    http://localhost:9000
echo    Default login: admin/admin
echo.
echo 🔧 Don't forget to:
echo    1. Login with admin/admin
echo    2. Change the password
echo    3. Create a project token
echo    4. Set SONAR_TOKEN environment variable
echo.
echo ✅ SonarQube is starting up...
pause