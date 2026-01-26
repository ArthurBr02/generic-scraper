#!/bin/sh

echo "Checking Playwright installation..."

# Vérifier si les navigateurs Playwright sont installés
if [ ! -d "/root/.cache/ms-playwright" ]; then
    echo "Installing Playwright browsers..."
    npx playwright install chromium
else
    echo "Playwright browsers already installed"
fi

echo "Starting backend server..."
npm run dev
