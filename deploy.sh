#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "==================================="
echo "🚀 Starting RetailIQ Deployment..."
echo "==================================="

echo "📥 Pulling latest code from GitHub..."
git pull origin main

echo "🛑 Stopping existing containers..."
docker-compose down

echo "🏗️ Building and starting new containers..."
docker-compose up -d --build

echo "🧹 Cleaning up old unused Docker images..."
docker image prune -f

echo "✅ Deployment successful! RetailIQ is now live."
echo "==================================="
