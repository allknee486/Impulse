#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Impulse with Cloudflare Tunnel...${NC}"

# Launch the development servers
echo -e "${YELLOW}Launching development servers...${NC}"
./launchdev.sh &
LAUNCH_PID=$!

# Wait for frontend to be ready on port 5173
echo -e "${YELLOW}Waiting for frontend server to be ready...${NC}"
while ! nc -z localhost 5173 2>/dev/null; do
    sleep 1
done
echo -e "${GREEN}Frontend server is ready!${NC}"

# Wait for backend to be ready on port 8000
echo -e "${YELLOW}Waiting for backend server to be ready...${NC}"
while ! nc -z localhost 8000 2>/dev/null; do
    sleep 1
done
echo -e "${GREEN}Backend server is ready!${NC}"

# Start cloudflared tunnel and capture the URL
echo -e "${YELLOW}Starting cloudflared tunnel...${NC}"
TUNNEL_LOG=$(mktemp)

# Start cloudflared in background and capture output
cloudflared tunnel --url http://localhost:5173 > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

# Wait for the tunnel URL to appear in the log
echo -e "${YELLOW}Waiting for tunnel URL...${NC}"
TUNNEL_URL=""
for i in {1..30}; do
    if grep -q "https://.*trycloudflare.com" "$TUNNEL_LOG"; then
        TUNNEL_URL=$(grep -oP 'https://[^\s]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -1)
        break
    fi
    sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
    echo -e "${YELLOW}Could not detect tunnel URL automatically. Check the cloudflared output:${NC}"
    cat "$TUNNEL_LOG"
    exit 1
fi

echo -e "${GREEN}Tunnel URL: $TUNNEL_URL${NC}"

# Copy URL to clipboard
if command -v xclip &> /dev/null; then
    echo -n "$TUNNEL_URL" | xclip -selection clipboard
    echo -e "${GREEN}URL copied to clipboard (xclip)${NC}"
elif command -v wl-copy &> /dev/null; then
    echo -n "$TUNNEL_URL" | wl-copy
    echo -e "${GREEN}URL copied to clipboard (wl-copy)${NC}"
elif command -v pbcopy &> /dev/null; then
    echo -n "$TUNNEL_URL" | pbcopy
    echo -e "${GREEN}URL copied to clipboard (pbcopy)${NC}"
else
    echo -e "${YELLOW}No clipboard tool found. Please copy manually: $TUNNEL_URL${NC}"
fi

# Extract the hostname from the URL
TUNNEL_HOST=$(echo "$TUNNEL_URL" | sed 's|https://||' | sed 's|/.*||')

# Export environment variables for Django to use
export TUNNEL_URL
export TUNNEL_HOST

echo -e "${GREEN}Environment variables set:${NC}"
echo -e "${BLUE}TUNNEL_URL=${TUNNEL_URL}${NC}"
echo -e "${BLUE}TUNNEL_HOST=${TUNNEL_HOST}${NC}"

# Update Vite config to accept connections from any host
echo -e "${YELLOW}Updating Vite configuration...${NC}"
VITE_CONFIG="frontend/vite.config.js"

# Backup the original vite config
cp "$VITE_CONFIG" "${VITE_CONFIG}.backup"

if ! grep -q "server:" "$VITE_CONFIG"; then
    # Add server configuration with allowedHosts
    sed -i "/plugins: \[react()\],/a\\
  server: {\\
    host: true,\\
    port: 5173,\\
    strictPort: true,\\
    allowedHosts: ['$TUNNEL_HOST'],\\
  }," "$VITE_CONFIG"
    echo -e "${GREEN}Vite config updated!${NC}"
elif ! grep -q "allowedHosts:" "$VITE_CONFIG"; then
    # Add allowedHosts to existing server config
    sed -i "/strictPort: true,/a\\
    allowedHosts: ['$TUNNEL_HOST'],\\" "$VITE_CONFIG"
    echo -e "${GREEN}Vite config updated with allowedHosts!${NC}"
else
    # Update existing allowedHosts
    sed -i "s|allowedHosts: \[.*\]|allowedHosts: ['$TUNNEL_HOST']|" "$VITE_CONFIG"
    echo -e "${GREEN}Vite config allowedHosts updated!${NC}"
fi

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Setup complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "${BLUE}Tunnel URL: ${GREEN}$TUNNEL_URL${NC}"
echo -e "${BLUE}Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "${BLUE}Backend: ${GREEN}http://localhost:8000${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "${YELLOW}Note: API requests will be proxied through the tunnel${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"

    # Restore original vite config
    if [ -f "${VITE_CONFIG}.backup" ]; then
        mv "${VITE_CONFIG}.backup" "$VITE_CONFIG"
        echo -e "${GREEN}Vite config restored${NC}"
    fi

    # Kill cloudflared
    kill $TUNNEL_PID 2>/dev/null

    # Kill the launch script and its children
    pkill -P $LAUNCH_PID 2>/dev/null
    kill $LAUNCH_PID 2>/dev/null

    # Clean up log file
    rm -f "$TUNNEL_LOG"

    # Kill Django and npm processes
    ./killdjango.sh 2>/dev/null
    pkill -f "npm run dev" 2>/dev/null

    echo -e "${GREEN}Services stopped${NC}"
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Wait for tunnel process to keep script running
wait $TUNNEL_PID
