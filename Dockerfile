# ============================
# Stage 1: Build Frontend
# ============================
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files first (for Docker layer caching)
COPY frontend/package*.json ./

# Install frontend dependencies (using npm install instead of ci to avoid lockfile issues)
RUN npm install

# Copy frontend source
COPY frontend/ ./

# Set the production API URL — Nginx will proxy /api to backend
ENV REACT_APP_API_URL=/api

# Don't publish source maps: they expose the full original frontend source
ENV GENERATE_SOURCEMAP=false

# Build React app
RUN npm run build


# ============================
# Stage 2: Build Backend
# ============================
FROM node:22-alpine AS backend-build

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install production dependencies only (using npm install instead of ci to avoid lockfile issues)
RUN npm install --omit=dev

# Copy backend source
COPY backend/ ./


# ============================
# Stage 3: Production Image
# ============================
FROM node:22-alpine

# Add dumb-init for proper signal handling (PID 1 problem)
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S sologix && \
    adduser -S sologix -u 1001 -G sologix

WORKDIR /app

# Copy backend from build stage
COPY --from=backend-build --chown=sologix:sologix /app/backend ./backend

# Copy frontend build output into backend's expected location
COPY --from=frontend-build --chown=sologix:sologix /app/frontend/build ./frontend/build

# Copy root package.json (for npm start)
COPY --chown=sologix:sologix package.json ./

# Create uploads directory
RUN mkdir -p /app/backend/uploads && chown sologix:sologix /app/backend/uploads

# Switch to non-root user
USER sologix

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "backend/server.js"]
