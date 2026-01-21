FROM node:20-alpine

WORKDIR /app

# Install build tools for native dependencies (sqlite3) and Playwright dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Playwright to use system chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install to update lockfile with new deps)
RUN npm install

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p /app/configs /app/logs /app/output /app/data

# Expose port
EXPOSE 4000

# Start development server with tsx watch
CMD ["npm", "run", "dev"]
