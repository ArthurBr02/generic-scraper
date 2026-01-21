#!/bin/bash

# ============================================
# Generic Scraper V2 - Quick Start Script
# ============================================

set -e

echo ""
echo "========================================"
echo "  Generic Scraper V2 - Docker Setup"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "[ERROR] Docker Compose is not installed"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "[OK] Docker and Docker Compose are installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "[INFO] Creating .env file from .env.example..."
    cp .env.example .env
    echo "[OK] .env file created"
else
    echo "[INFO] .env file already exists"
fi
echo ""

# Ask user which mode to use
echo "Select deployment mode:"
echo "  1. Production (optimized build)"
echo "  2. Development (with hot-reload)"
echo ""
read -p "Enter your choice (1 or 2): " mode

if [ "$mode" == "1" ]; then
    echo ""
    echo "[INFO] Starting in PRODUCTION mode..."
    docker-compose up -d --build
elif [ "$mode" == "2" ]; then
    echo ""
    echo "[INFO] Starting in DEVELOPMENT mode..."
    docker-compose -f docker-compose.dev.yml up -d --build
else
    echo "[ERROR] Invalid choice. Please run the script again."
    exit 1
fi

echo ""
echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:4000"
echo "Health:   http://localhost:4000/api/health"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose down"
echo ""
