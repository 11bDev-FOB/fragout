#!/bin/bash

# FragOut Standalone Deployment Script
# Deploys FragOut service to connect with shared infrastructure

set -e

cd "$(dirname "$0")"

echo "🚀 Deploying FragOut (standalone mode)..."

# Check if infrastructure network exists
if ! docker network ls | grep -q "pleb-services"; then
    echo "❌ Infrastructure network 'pleb-services' not found!"
    echo "Please deploy the infrastructure first:"
    echo "  cd /home/plebone/infrastructure && ./scripts/deploy-infrastructure.sh"
    exit 1
fi

# Check if Caddy is running
if ! docker ps | grep -q "caddy-proxy"; then
    echo "❌ Caddy proxy not found!"
    echo "Please ensure infrastructure is running:"
    echo "  cd /home/plebone/infrastructure && docker-compose up -d"
    exit 1
fi

# Build and deploy Y'all Web
echo "📦 Building Y'all Web..."
docker-compose -f docker-compose.standalone.yml build

echo "🔄 Starting Y'all Web service..."
docker-compose -f docker-compose.standalone.yml up -d

# Wait for service to be healthy
echo "⏳ Waiting for Y'all Web to be ready..."
timeout 60 bash -c 'until docker-compose -f docker-compose.standalone.yml ps | grep -q "healthy\|Up"; do sleep 2; done' || {
    echo "❌ Y'all Web failed to start properly"
    echo "Logs:"
    docker-compose -f docker-compose.standalone.yml logs --tail=20
    exit 1
}

echo "✅ FragOut deployed successfully!"
echo ""
echo "🌐 Available at: https://fragout.11b.dev"
echo "📊 Health check: https://fragout.11b.dev/api/health"
echo ""
echo "📋 Management commands:"
echo "  View logs:    docker-compose -f docker-compose.standalone.yml logs -f"
echo "  Stop service: docker-compose -f docker-compose.standalone.yml down"
echo "  Restart:      docker-compose -f docker-compose.standalone.yml restart"
echo ""
echo "🔧 Troubleshooting:"
echo "  Check status: docker-compose -f docker-compose.standalone.yml ps"
echo "  Network info: docker network inspect pleb-services"
