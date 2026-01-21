@echo off
REM ============================================
REM Generic Scraper V2 - Quick Start Script
REM ============================================

echo.
echo ========================================
echo   Generic Scraper V2 - Docker Setup
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH
    echo Please install Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed or not in PATH
    pause
    exit /b 1
)

echo [OK] Docker and Docker Compose are installed
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo [INFO] Creating .env file from .env.example...
    copy .env.example .env >nul
    echo [OK] .env file created
) else (
    echo [INFO] .env file already exists
)
echo.

REM Ask user which mode to use
echo Select deployment mode:
echo   1. Production (optimized build)
echo   2. Development (with hot-reload)
echo.
set /p mode="Enter your choice (1 or 2): "

if "%mode%"=="1" (
    echo.
    echo [INFO] Starting in PRODUCTION mode...
    docker-compose up -d --build
) else if "%mode%"=="2" (
    echo.
    echo [INFO] Starting in DEVELOPMENT mode...
    docker-compose -f docker-compose.dev.yml up -d --build
) else (
    echo [ERROR] Invalid choice. Please run the script again.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:4000
echo Health:   http://localhost:4000/api/health
echo.
echo To view logs:
echo   docker-compose logs -f
echo.
echo To stop services:
echo   docker-compose down
echo.
pause
