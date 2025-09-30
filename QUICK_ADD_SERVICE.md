# Quick Reference: Adding New Services

## 1. Add Service to Docker Compose
```yaml
# Add to docker-compose.prod.yml
your-service:
  image: your/service:tag
  restart: unless-stopped
  networks:
    - fragout-network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:PORT/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

## 2. Update Caddyfile
- Uncomment the service block in `Caddyfile`
- Replace `serviceX` with your actual service name
- Replace `PORT` with your service's port
- Update log filename

## 3. Add DNS Record
```
your-service.11b.dev  A  YOUR_SERVER_IP
```

## 4. Deploy
```bash
# Rebuild and restart
docker compose -f docker-compose.prod.yml up --build -d

# Or just restart caddy after config changes
docker compose -f docker-compose.prod.yml restart caddy
```

## 5. Test
```bash
curl -I https://your-service.11b.dev/health
```
