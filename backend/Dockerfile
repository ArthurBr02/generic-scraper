FROM node:20

WORKDIR /app

# Copy backend package files
COPY ./backend/package*.json ./

# Install backend dependencies
RUN npm install

# Install Playwright browsers and system dependencies for backend
RUN npx playwright install --with-deps chromium

# Create scraper-engine directory
RUN mkdir -p /app/scraper-engine

# Copy scraper-engine files from project root
COPY ./package.json /app/scraper-engine/package.json
COPY ./src /app/scraper-engine/src
COPY ./data /app/scraper-engine/data

# Install scraper-engine dependencies
WORKDIR /app/scraper-engine
RUN npm install

# Install Playwright browsers for scraper-engine
RUN npx playwright install chromium

# Return to app directory
WORKDIR /app

# Copy backend source code
COPY ./backend .

# Create necessary directories
RUN mkdir -p /app/configs /app/logs /app/output /app/data

# Copy startup script
COPY ./backend/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose port
EXPOSE 4000

# Start with custom script that checks Playwright installation
CMD ["/app/start.sh"]
