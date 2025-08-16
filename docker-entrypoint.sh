#!/bin/sh
set -e

# Set default backend URL if not provided
if [ -z "$BACKEND_URL" ]; then
    export BACKEND_URL="http://localhost:8082"
fi

echo "Using BACKEND_URL: $BACKEND_URL"

# Replace the backend URL in nginx configuration
envsubst '$BACKEND_URL' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Validate nginx configuration
nginx -t

# Start nginx
exec "$@"
