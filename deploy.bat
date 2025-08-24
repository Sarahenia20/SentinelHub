@echo off
echo 🛡️ SentinelHub - Professional Security Platform
echo =================================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if environment file exists
if not exist ".env" (
    echo ⚠️ Environment file not found. Creating from template...
    copy .env.example .env >nul
    echo ✅ Created .env file from template
    echo 📝 Please edit .env file with your API keys before proceeding
    echo.
    echo Required environment variables:
    echo - CLERK_PUBLISHABLE_KEY ^(Get from https://clerk.com^)
    echo - CLERK_SECRET_KEY ^(Get from https://clerk.com^)
    echo.
    echo Optional but recommended:
    echo - VIRUSTOTAL_API_KEY ^(Get from https://virustotal.com^)
    echo - SHODAN_API_KEY ^(Get from https://shodan.io^)
    echo - ABUSEIPDB_API_KEY ^(Get from https://abuseipdb.com^)
    echo.
    set /p continue_deploy="Continue with deployment? (y/n): "
    if not "%continue_deploy%"=="y" exit /b 0
)

REM Build and start services
echo 🚀 Starting SentinelHub services...
echo.

REM Pull latest images
echo 📦 Pulling Docker images...
docker-compose pull

REM Build custom images
echo 🔨 Building custom images...
docker-compose build

REM Start services
echo ▶️ Starting services...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check service health
echo 🔍 Checking service health...
echo.

REM Check Redis
docker-compose exec -T redis redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo ❌ Redis: Not responding
) else (
    echo ✅ Redis: Running
)

REM Check API Gateway
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo ❌ API Gateway: Not responding
) else (
    echo ✅ API Gateway: Running
)

REM Check Frontend
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend: Not responding
) else (
    echo ✅ Frontend: Running
)

REM Check Grafana
curl -s http://localhost:3001 >nul 2>&1
if errorlevel 1 (
    echo ❌ Grafana: Not responding
) else (
    echo ✅ Grafana: Running
)

echo.
echo 🎉 SentinelHub deployment complete!
echo.
echo 📱 Access your applications:
echo - 🌐 Frontend: http://localhost:3000
echo - ⚡ API Gateway: http://localhost:5000
echo - 📊 Grafana: http://localhost:3001 ^(admin/sentinelhub123^)
echo - 🔍 Prometheus: http://localhost:9090
echo - 💾 Redis Insight: http://localhost:8001
echo - 📈 SonarQube: http://localhost:9000
echo.
echo 📚 Next steps:
echo 1. Configure your API keys in .env file
echo 2. Set up Clerk authentication at https://clerk.com
echo 3. Test the scanner functionality
echo 4. Review Grafana dashboards
echo.
echo 🔧 Useful commands:
echo - View logs: docker-compose logs -f [service]
echo - Stop services: docker-compose down
echo - Restart services: docker-compose restart
echo - Update services: docker-compose pull ^&^& docker-compose up -d

pause