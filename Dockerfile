# Multi-stage build for React/Vite application
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration template
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Copy and setup entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

# Development stage
FROM node:22-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Expose port 3000 for development server
EXPOSE 3000

# Start development server
CMD ["npm", "start"]
