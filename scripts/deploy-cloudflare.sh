#!/bin/bash

# VibeSec Cloudflare Deployment Script
# This script helps deploy VibeSec MCP Server to Cloudflare Workers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running from vibesec root directory
if [ ! -f "package.json" ] || [ ! -f "wrangler.toml" ]; then
  log_error "This script must be run from the VibeSec root directory"
  exit 1
fi

log_info "VibeSec Cloudflare Deployment Script v1.0"
echo ""

# Step 1: Check prerequisites
log_info "Step 1: Checking prerequisites..."

if ! command -v npm &> /dev/null; then
  log_error "npm is not installed. Please install Node.js and npm first."
  exit 1
fi
log_success "npm found"

if ! command -v wrangler &> /dev/null; then
  log_warning "wrangler CLI not found. Installing globally..."
  npm install -g wrangler
  log_success "wrangler installed"
fi
log_success "wrangler found"

# Step 2: Check authentication
log_info "Step 2: Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null 2>&1; then
  log_warning "Not authenticated with Cloudflare. Please authenticate..."
  echo ""
  echo "Opening Cloudflare login page in browser..."
  wrangler auth login
  if [ $? -ne 0 ]; then
    log_error "Authentication failed. Exiting."
    exit 1
  fi
  log_success "Successfully authenticated with Cloudflare"
else
  log_success "Already authenticated with Cloudflare"
fi
echo ""

# Step 3: Install dependencies
log_info "Step 3: Installing dependencies..."
npm install > /dev/null 2>&1
log_success "Dependencies installed"
echo ""

# Step 4: Build the project
log_info "Step 4: Building for Cloudflare..."
npm run build:cloudflare
if [ $? -ne 0 ]; then
  log_error "Build failed. Exiting."
  exit 1
fi
log_success "Build successful"
echo ""

# Step 5: Run linting
log_info "Step 5: Running linting checks..."
npm run lint 2>&1 | tail -3
log_success "Linting complete"
echo ""

# Step 6: Deploy to Cloudflare
log_info "Step 6: Deploying to Cloudflare Workers..."
DEPLOY_OUTPUT=$(wrangler deploy 2>&1)
if echo "$DEPLOY_OUTPUT" | grep -q "Deployed to"; then
  log_success "Successfully deployed to Cloudflare Workers!"
  echo ""
  echo "$DEPLOY_OUTPUT" | grep -E "(Deployed to|https://)"
  echo ""
else
  log_error "Deployment failed"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi
echo ""

# Step 7: Get and display Worker URL
log_info "Step 7: Retrieving Worker information..."
WORKER_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://[^/\s]+\.workers\.dev' | head -1)

if [ -z "$WORKER_URL" ]; then
  log_warning "Could not extract Worker URL from deployment output"
  log_info "You can find your Worker URL at https://dash.cloudflare.com/"
  log_info "Look for 'Workers' in the left sidebar"
else
  log_success "Worker deployed at: $WORKER_URL"
  WS_URL="${WORKER_URL/https/wss}"
  log_success "WebSocket URL: $WS_URL"
  echo ""
  
  # Step 8: Show configuration instructions
  log_info "Step 8: Next steps..."
  echo ""
  echo "To use VibeSec in Claude Code, update .claude/mcp.json:"
  echo ""
  echo "{\"
  echo "  \"mcpServers\": {"
  echo "    \"vibesec\": {"
  echo "      \"type\": \"remote\","
  echo "      \"url\": \"${WS_URL}\""
  echo "    }"
  echo "  }"
  echo "}"
  echo ""
  
  # Step 9: Test connection
  log_info "Step 9: Testing Worker endpoint..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -I "$WORKER_URL")
  
  if [ "$HTTP_CODE" = "426" ]; then
    log_success "Worker is responding correctly (426 for non-WebSocket request is expected)"
  elif [ "$HTTP_CODE" = "200" ]; then
    log_success "Worker is responding correctly"
  else
    log_warning "Unexpected HTTP response code: $HTTP_CODE"
  fi
  echo ""
  
  # Step 10: Show monitoring command
  log_info "To view live logs, run:"
  echo "  wrangler tail --format=pretty"
  echo ""
  log_success "Deployment complete! 🚀"
fi
