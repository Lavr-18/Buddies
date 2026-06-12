#!/bin/bash
# Update .env and Telegram webhook after ngrok is already running.
# Run ngrok FIRST in a separate terminal: ngrok http 8000
# Then run this script.

set -e

ENV_FILE="$(dirname "$0")/../.env"

# Get the public URL from running ngrok
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "
import sys, json
try:
    tunnels = json.load(sys.stdin)['tunnels']
    for t in tunnels:
        if t['proto'] == 'https':
            print(t['public_url'])
            break
except:
    pass
")

if [ -z "$NGROK_URL" ]; then
    echo "ERROR: ngrok is not running."
    echo "Start it first in a separate terminal: ngrok http 8000"
    exit 1
fi

echo "ngrok URL: $NGROK_URL"

# Update .env
if grep -q "^WEBAPP_URL=" "$ENV_FILE"; then
    sed -i '' "s|^WEBAPP_URL=.*|WEBAPP_URL=$NGROK_URL|" "$ENV_FILE"
else
    echo "WEBAPP_URL=$NGROK_URL" >> "$ENV_FILE"
fi

# Get BOT_TOKEN from .env
BOT_TOKEN=$(grep "^BOT_TOKEN=" "$ENV_FILE" | cut -d'=' -f2)

if [ -z "$BOT_TOKEN" ] || [ "$BOT_TOKEN" = "your_bot_token_here" ]; then
    echo "WARNING: BOT_TOKEN not set — skipping webhook registration"
else
    WEBHOOK_RESPONSE=$(curl -s -X POST \
        "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
        -H "Content-Type: application/json" \
        -d "{\"url\": \"${NGROK_URL}/webhook\"}")
    echo "Webhook: $WEBHOOK_RESPONSE"
fi

echo ""
echo "Done! Now run: docker compose restart backend"
