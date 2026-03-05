# GPS V2 - Panduan Deployment & Monitoring

## Server Info
- **Server**: Ubuntu 24.04 — `119.235.255.112`
- **SSH**: `ssh root@119.235.255.112` (password: `traccar@001`)
- **Platform**: Docker Swarm + Easypanel
- **CI/CD**: GitHub Actions (self-hosted runner on same server)

## Architecture

```
┌─────────────────────────────────────────────────┐
│  GitHub Push (master)                           │
│    ├─ gsi-traccar → build-deploy.yml            │
│    │   Build Java → Docker multi-arch → Deploy  │
│    └─ traccar-web → docker-deploy.yml           │
│        Build Vite → Docker → Deploy             │
└─────────┬───────────────────────────┬───────────┘
          │                           │
    ┌─────▼──────┐            ┌──────▼───────┐
    │ Docker Hub │            │ Docker Hub   │
    │ guntoroyk/ │            │ guntoroyk/   │
    │ traccar:   │            │ traccar-web: │
    │ latest     │            │ latest       │
    └─────┬──────┘            └──────┬───────┘
          │                          │
    ┌─────▼──────────────────────────▼───────┐
    │  Docker Swarm (119.235.255.112)        │
    │  ├─ gsi-traccar_traccar   (backend)    │
    │  ├─ gsi-traccar_frontend  (frontend)   │
    │  ├─ gsi-traccar_mysql     (database)   │
    │  ├─ gsi-traccar_minio     (storage)    │
    │  └─ traefik               (reverse proxy)│
    └────────────────────────────────────────┘
```

---

## 1. Deploy Otomatis (CI/CD)

### Cara Kerja
Push ke `master` branch otomatis trigger GitHub Actions:
- **Backend** (`gsi-traccar`): Build Java → Gradle → Docker image → Push Docker Hub → Service update
- **Frontend** (`traccar-web`): Build Vite → Docker image → Push Docker Hub → Service update

### Trigger Manual via GitHub API
```bash
# Dapatkan token dari git credential
GH_TOKEN=$(git credential fill <<'EOF' 2>/dev/null | grep password | sed 's/password=//'
protocol=https
host=github.com

EOF
)

# Trigger backend build + deploy
curl -s -w "\nHTTP %{http_code}" -X POST \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/Ahsan-Studio/gsi-traccar/actions/workflows/build-deploy.yml/dispatches" \
  -d '{"ref":"master"}'

# Trigger frontend build + deploy
curl -s -w "\nHTTP %{http_code}" -X POST \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/Ahsan-Studio/traccar-web/actions/workflows/docker-deploy.yml/dispatches" \
  -d '{"ref":"master"}'

# HTTP 204 = berhasil trigger
```

### Cek Status CI/CD
```bash
python3 /tmp/check_ci.py
```
Atau buka:
- Backend: https://github.com/Ahsan-Studio/gsi-traccar/actions
- Frontend: https://github.com/Ahsan-Studio/traccar-web/actions

---

## 2. Deploy Manual via SSH

### Login
```bash
ssh root@119.235.255.112
# Password: traccar@001
```
Atau dari Mac:
```bash
sshpass -p 'traccar@001' ssh -o StrictHostKeyChecking=no root@119.235.255.112
```

### Deploy Backend (Manual)
```bash
# 1. Pull image terbaru dari Docker Hub
docker pull guntoroyk/traccar:latest

# 2. Update service (stop-first untuk hindari port conflict)
docker service update \
  --force \
  --update-order stop-first \
  --image guntoroyk/traccar:latest \
  gsi-traccar_traccar

# 3. Tunggu service ready
sleep 30
docker service ps gsi-traccar_traccar --format 'table {{.Name}}\t{{.CurrentState}}\t{{.Image}}' | head -3
```

### Deploy Frontend (Manual)
```bash
# 1. Pull image terbaru dari Docker Hub
docker pull guntoroyk/traccar-web:latest

# 2. Update service
docker service update \
  --force \
  --update-order stop-first \
  --image guntoroyk/traccar-web:latest \
  gsi-traccar_frontend

# 3. Tunggu service ready
sleep 15
docker service ps gsi-traccar_frontend --format 'table {{.Name}}\t{{.CurrentState}}\t{{.Image}}' | head -3
```

---

## 3. Cara Cek Status Deployment

### A. Cek Semua Service
```bash
# SSH ke server, lalu:
docker service ls --format 'table {{.Name}}\t{{.Replicas}}\t{{.Image}}' | grep traccar
```
Output yang benar:
```
gsi-traccar_frontend   1/1   guntoroyk/traccar-web:latest
gsi-traccar_traccar    1/1   guntoroyk/traccar:latest
```
- `1/1` = running OK
- `0/1` = service down!

### B. Cek Container Running
```bash
docker ps --filter 'name=traccar' --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'
```
Output yang benar:
```
gsi-traccar_traccar.1.xxx    Up X minutes (healthy)   guntoroyk/traccar:latest
gsi-traccar_frontend.1.xxx   Up X minutes              guntoroyk/traccar-web:latest
```
- Backend harus `(healthy)` — kalau `(unhealthy)` berarti ada masalah

### C. Cek Versi/Commit yang Terdeploy
```bash
# Backend — cek commit revision di image label
docker inspect $(docker ps -q --filter 'name=gsi-traccar_traccar.1') \
  --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' 2>/dev/null

# Frontend — cek commit revision
docker inspect $(docker ps -q --filter 'name=gsi-traccar_frontend.1') \
  --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' 2>/dev/null
```
Bandingkan output dengan commit terakhir di GitHub:
```bash
# Di lokal
cd ~/Documents/GPS/gsi-traccar && git log --oneline -1
cd ~/Documents/GPS/traccar-web && git log --oneline -1
```

### D. Cek API Backend Responding
```bash
# Dari server:
curl -s http://localhost:8082/api/server | python3 -m json.tool | head -5

# Cek API baru (Tasks, Chat, Share, Logbook):
curl -s http://localhost:8082/api/tasks -H "Accept: application/json" -w "\nHTTP %{http_code}\n"
curl -s http://localhost:8082/api/chat -H "Accept: application/json" -w "\nHTTP %{http_code}\n"
curl -s http://localhost:8082/api/share-positions -H "Accept: application/json" -w "\nHTTP %{http_code}\n"
curl -s http://localhost:8082/api/logbook -H "Accept: application/json" -w "\nHTTP %{http_code}\n"
```
- HTTP 200 = OK
- HTTP 401 = perlu auth (normal untuk beberapa endpoint)
- HTTP 404 = API belum terdeploy (image lama)

### E. Cek Frontend Accessible
```bash
# Dari server:
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000/
```
- HTTP 200 = OK

### F. Cek Logs Kalau Ada Masalah
```bash
# Backend logs (50 baris terakhir)
docker service logs gsi-traccar_traccar --tail 50

# Frontend logs
docker service logs gsi-traccar_frontend --tail 50

# Real-time following
docker service logs gsi-traccar_traccar -f
```

---

## 4. Troubleshooting

### Backend Service Gagal Start
```bash
# Cek alasan failure
docker service ps gsi-traccar_traccar --no-trunc --format 'table {{.Name}}\t{{.CurrentState}}\t{{.Error}}' | head -5

# Restart service
docker service update --force gsi-traccar_traccar

# Kalau port conflict (port 8082 already in use)
docker service update --force --update-order stop-first gsi-traccar_traccar
```

### Database Migration Error (Liquibase)
```bash
# Cek Traccar startup logs
docker service logs gsi-traccar_traccar --tail 100 | grep -i 'liquibase\|migration\|error'
```

### Runner Stuck / Not Picking Up Jobs
```bash
# Restart GitHub Actions runner
systemctl restart actions.runner.Ahsan-Studio-gsi-traccar.devserver.service

# Cek status
systemctl status actions.runner.Ahsan-Studio-gsi-traccar.devserver.service
```

### Disk Space Full
```bash
# Cek disk
df -h /

# Cleanup Docker
docker system prune -af --volumes
docker builder prune -af
```

---

## 5. Quick Reference — One-Liner Commands

```bash
# === DARI MAC (dengan sshpass) ===

# Status semua service
sshpass -p 'traccar@001' ssh root@119.235.255.112 "docker service ls"

# Cek commit backend yang running
sshpass -p 'traccar@001' ssh root@119.235.255.112 "docker inspect \$(docker ps -q --filter 'name=gsi-traccar_traccar.1') --format '{{index .Config.Labels \"org.opencontainers.image.revision\"}}'"

# Cek commit frontend yang running
sshpass -p 'traccar@001' ssh root@119.235.255.112 "docker inspect \$(docker ps -q --filter 'name=gsi-traccar_frontend.1') --format '{{index .Config.Labels \"org.opencontainers.image.revision\"}}'"

# Force redeploy backend
sshpass -p 'traccar@001' ssh root@119.235.255.112 "docker pull guntoroyk/traccar:latest && docker service update --force --update-order stop-first --image guntoroyk/traccar:latest gsi-traccar_traccar"

# Force redeploy frontend
sshpass -p 'traccar@001' ssh root@119.235.255.112 "docker pull guntoroyk/traccar-web:latest && docker service update --force --update-order stop-first --image guntoroyk/traccar-web:latest gsi-traccar_frontend"
```

---

## 6. Alur Deploy yang Ideal

```
1. Code → Push ke master
2. GitHub Actions auto-trigger
3. Build Docker image
4. Push ke Docker Hub
5. Service update di server
6. Verifikasi:
   a. docker service ls → Replicas 1/1
   b. docker ps → Status (healthy)
   c. Cek commit revision match
   d. curl API → HTTP 200
```
