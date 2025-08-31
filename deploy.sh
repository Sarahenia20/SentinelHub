#!/bin/bash

# SentinelHub Deployment Script
echo "🛡️ SentinelHub - Professional Security Platform"
echo "================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if environment file exists
if [ ! -f ".env" ]; then
    echo "⚠️ Environment file not found. Creating from template..."
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "📝 Please edit .env file with your API keys before proceeding"
    echo ""
    echo "Required environment variables:"
    echo "- CLERK_PUBLISHABLE_KEY (Get from https://clerk.com)"
    echo "- CLERK_SECRET_KEY (Get from https://clerk.com)"
    echo ""
    echo "Optional but recommended:"
    echo "- VIRUSTOTAL_API_KEY (Get from https://virustotal.com)"
    echo "- SHODAN_API_KEY (Get from https://shodan.io)"
    echo "- ABUSEIPDB_API_KEY (Get from https://abuseipdb.com)"
    echo ""
    read -p "Continue with deployment? (y/n): " continue_deploy
    if [ "$continue_deploy" != "y" ]; then
        exit 0
    fi
fi

# Build and start services
echo "🚀 Starting SentinelHub services..."
echo ""

# Pull latest images
echo "📦 Pulling Docker images..."
docker-compose pull

# Build custom images
echo "🔨 Building custom images..."
docker-compose build

# Start services
echo "▶️ Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
echo ""

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: Running"
else
    echo "❌ Redis: Not responding"
fi

# Check API Gateway
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ API Gateway: Running"
else
    echo "❌ API Gateway: Not responding"
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend: Running"
else
    echo "❌ Frontend: Not responding"
fi

# Check Grafana
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Grafana: Running"
else
    echo "❌ Grafana: Not responding"
fi

echo ""
echo "🎉 SentinelHub deployment complete!"
echo ""
echo "📱 Access your applications:"
echo "- 🌐 Frontend: http://localhost:3000"
echo "- ⚡ API Gateway: http://localhost:5000"
echo "- 📊 Grafana: http://localhost:3001 (admin/sentinelhub123)"
echo "- 🔍 Prometheus: http://localhost:9090"
echo "- 💾 Redis Insight: http://localhost:8001"
echo "- 📈 SonarQube: http://localhost:9000"
echo ""
echo "📚 Next steps:"
echo "1. Configure your API keys in .env file"
echo "2. Set up Clerk authentication at https://clerk.com"
echo "3. Test the scanner functionality"
echo "4. Review Grafana dashboards"
echo ""
echo "🔧 Useful commands:"
echo "- View logs: docker-compose logs -f [service]"
echo "- Stop services: docker-compose down"
echo "- Restart services: docker-compose restart"
echo "- Update services: docker-compose pull && docker-compose up -d"