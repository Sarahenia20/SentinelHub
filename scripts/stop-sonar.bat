@echo off
echo 🛑 Stopping SonarQube containers...
docker-compose -f docker-compose.sonar.yml down
echo ✅ SonarQube containers stopped.
pause