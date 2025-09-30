# Caddy Multi-Service Routing Plan

## Overview
This server uses **subdomain-based routing** to handle multiple services through a single Caddy reverse proxy.

## Current Setup

### Active Services
- **Main App**: `fragout.11b.dev` → `fragout:3000` (FragOut - Social Media Posting)

### Planned Services (Ready to Deploy)
- **Service 1**: `service1.11b.dev` → `service1:PORT` (Replace with actual service name)
- **Service 2**: `service2.11b.dev` → `service2:PORT` (Replace with actual service name)

## DNS Configuration Required

For each new service, you'll need to add DNS A records pointing to your server IP:

```
service1.11b.dev  A  YOUR_SERVER_IP
service2.11b.dev  A  YOUR_SERVER_IP
```

## Adding a New Service

1. **Update `docker-compose.prod.yml`**:
   ```yaml
   your-new-service:
     image: your/service:latest
     restart: unless-stopped
     networks:
       - fragout-network
     # Add health check, volumes, etc.
   ```

2. **Uncomment the service block in `Caddyfile`**:
   - Find the commented section for your service
   - Update the service name and port
   - Adjust security headers if needed

3. **Add DNS record** for the subdomain

4. **Restart Caddy**: `docker compose -f docker-compose.prod.yml restart caddy`

## Benefits of This Approach

- ✅ **Clean separation**: Each service has its own subdomain
- ✅ **Independent SSL**: Automatic HTTPS for each subdomain
- ✅ **No conflicts**: Services don't interfere with each other
- ✅ **Easy debugging**: Clear service boundaries
- ✅ **Scalable**: Easy to add more services

## Security Features

Each service gets:
- Automatic HTTPS with Let's Encrypt
- Security headers (XSS, clickjacking protection, etc.)
- Gzip compression
- Access logging
- Health check endpoints

## Maintenance Notes

- All services share the `fragout-network` Docker network
- Caddy data is persisted in `caddy_data` volume
- SSL certificates are automatically managed
- Logs are stored in `caddy_logs` volume

## Troubleshooting

- Check service health: `docker compose -f docker-compose.prod.yml ps`
- View Caddy logs: `docker compose -f docker-compose.prod.yml logs caddy`
- Test SSL: `curl -I https://subdomain.11b.dev`
