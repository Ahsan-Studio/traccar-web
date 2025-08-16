# Docker Setup for Traccar Web

This directory contains Docker configuration files to containerize the Traccar Web application.

## Files Created

- **Dockerfile**: Multi-stage build configuration with production and development targets
- **nginx.conf**: Nginx configuration for serving the production build
- **.dockerignore**: Optimizes build context by excluding unnecessary files
- **docker-compose.yml**: Orchestration file for easy deployment

## Quick Start

### Production Build
```bash
# Build and run production version
docker-compose up traccar-web

# Or build manually
docker build --target production -t traccar-web:prod .
docker run -p 3000:80 traccar-web:prod
```

### Development Build
```bash
# Run development version with hot reload
docker-compose --profile dev up traccar-web-dev

# Or build manually
docker build --target development -t traccar-web:dev .
docker run -p 3001:3000 -v $(pwd):/app -v /app/node_modules traccar-web:dev
```

## Configuration

### Environment Variables
- `NODE_ENV`: Set to `production` or `development`
- `VITE_APP_VERSION`: Application version (defaults to package.json version)

### Ports
- **Production**: Port 3000 (nginx serving static files)
- **Development**: Port 3001 (Vite dev server with hot reload)

### API Backend Integration
The nginx configuration includes proxy settings for:
- `/api/*` → `http://traccar-backend:8082`
- `/api/socket` → WebSocket proxy for real-time updates

Update the backend service name in `nginx.conf` if your Traccar backend service has a different name.

## Production Deployment

The production build creates an optimized static build served by nginx with:
- Gzip compression
- Static asset caching
- Security headers
- Client-side routing support
- API proxying capabilities

## Development Features

The development setup includes:
- Hot module replacement
- Volume mounting for live code changes
- Development server on port 3000 (mapped to 3001 externally)
- Full development dependencies

## Network

Both services use the `traccar-network` bridge network, allowing communication with other Traccar services when deployed together.
