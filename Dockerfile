# VibeSec - Security Scanner for AI-Generated Code
# Multi-stage build for optimal image size

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm install --no-optional && \
    ls -la node_modules/.bin/ | grep tsc || echo "tsc not found in node_modules/.bin"

# Copy source code
COPY cli ./cli
COPY scanner ./scanner
COPY reporters ./reporters
COPY src ./src
COPY lib ./lib
COPY rules ./rules
COPY copy-assets.js ./

# Build the application
RUN npx tsc && node copy-assets.js

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy bin directory for MCP entry point
COPY bin ./bin

# Create non-root user for security
RUN addgroup -g 1001 vibesec && \
    adduser -D -u 1001 -G vibesec vibesec && \
    chown -R vibesec:vibesec /app

USER vibesec

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Set environment variables
ENV NODE_ENV=production \
    LOG_LEVEL=info

# Expose port (for future HTTP transport)
# EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command shows help
CMD ["node", "dist/cli/index.js", "--help"]
