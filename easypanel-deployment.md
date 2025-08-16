# Easypanel Deployment Guide for Traccar Web

This guide explains how to deploy the traccar-web application to Easypanel with configurable backend API URL.

## Prerequisites

- Easypanel account and access
- Docker image built and pushed to a registry (Docker Hub, GitHub Container Registry, etc.)
- Traccar backend service URL

## Configuration

### Environment Variables

Set the following environment variable in Easypanel:

| Variable | Description | Example |
|----------|-------------|---------|
| `BACKEND_URL` | Full URL to your Traccar backend API | `https://api.yourdomain.com` or `http://traccar-backend:8082` |

### Example Configurations

#### External Backend API
```bash
BACKEND_URL=https://api.traccar.yourdomain.com
```

#### Internal Service (same Easypanel project)
```bash
BACKEND_URL=http://traccar-backend:8082
```

#### Development/Testing
```bash
BACKEND_URL=http://localhost:8082
```

## Deployment Steps

### 1. Build and Push Docker Image

```bash
# Build the production image
docker build --target production -t your-registry/traccar-web:latest .

# Push to registry
docker push your-registry/traccar-web:latest
```

### 2. Create Service in Easypanel

1. **Create New Service**:
   - Go to your Easypanel project
   - Click "Create Service"
   - Choose "Docker Image"

2. **Configure Service**:
   - **Image**: `your-registry/traccar-web:latest`
   - **Port**: `80`
   - **Environment Variables**:
     - `BACKEND_URL`: Your backend API URL

3. **Domain Configuration**:
   - Set up your domain (e.g., `traccar.yourdomain.com`)
   - Enable HTTPS if needed

### 3. Service Configuration Example

```yaml
# Example Easypanel service configuration
name: traccar-web
image: your-registry/traccar-web:latest
ports:
  - containerPort: 80
    protocol: TCP
env:
  - name: BACKEND_URL
    value: "https://api.traccar.yourdomain.com"
domains:
  - host: traccar.yourdomain.com
    port: 80
    https: true
```

## Backend URL Formats

### HTTPS Backend (Recommended for Production)
```bash
BACKEND_URL=https://api.traccar.yourdomain.com
```

### HTTP Backend (Development/Internal)
```bash
BACKEND_URL=http://traccar-backend.internal:8082
```

### With Custom Port
```bash
BACKEND_URL=https://traccar.yourdomain.com:8443
```

## Testing the Deployment

1. **Check Service Status**: Ensure the service is running in Easypanel
2. **Test Web Interface**: Access your domain and verify the UI loads
3. **Test API Connection**: Check browser network tab for API calls
4. **Verify WebSocket**: Ensure real-time updates work if backend supports them

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**:
   - Check if `BACKEND_URL` is correct
   - Verify backend service is accessible from Easypanel
   - Check backend service health

2. **CORS Issues**:
   - Configure backend to allow requests from your frontend domain
   - Add proper CORS headers in backend configuration

3. **WebSocket Connection Failed**:
   - Ensure backend supports WebSocket connections
   - Check if proxy settings allow WebSocket upgrades

### Logs

Check Easypanel service logs for nginx and application errors:
```bash
# Look for these log patterns
# Successful startup: "Configuration complete; ready for start up"
# Backend connection: Check for 502/503 errors in access logs
# Environment: Verify BACKEND_URL is set correctly
```

## Security Considerations

1. **HTTPS**: Always use HTTPS for production deployments
2. **CORS**: Configure backend CORS properly
3. **Headers**: Security headers are already configured in nginx
4. **Environment Variables**: Keep sensitive backend URLs secure

## Scaling

- The frontend is stateless and can be scaled horizontally
- Consider using a CDN for static assets
- Backend URL should point to a load-balanced backend service

## Updates

To update the deployment:
1. Build new image with updated code
2. Push to registry
3. Update service in Easypanel to use new image tag
4. Easypanel will handle rolling update
