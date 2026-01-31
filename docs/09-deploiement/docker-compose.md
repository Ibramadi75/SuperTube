# Docker Compose

## Configuration Standard

```yaml
# Frontend React (Nginx)
supertube-frontend:
  build: ./supertube/frontend
  container_name: supertube-frontend
  ports:
    - "8080:80"
  depends_on:
    - supertube-backend
  restart: unless-stopped

# Backend API
supertube-backend:
  build: ./supertube/backend
  container_name: supertube-backend
  ports:
    - "3000:3000"
  volumes:
    - ./supertube/data:/app/data
    - ./youtube:/youtube
  environment:
    - TZ=Europe/Paris
    - YTDLP_API_URL=http://ytdlp-api:3001
  depends_on:
    - ytdlp-api
  restart: unless-stopped

# yt-dlp API (sidecar)
ytdlp-api:
  build: ./ytdlp-api
  container_name: ytdlp-api
  volumes:
    - ./youtube:/youtube
  environment:
    - TZ=Europe/Paris
  restart: unless-stopped
```

## Alternative : Image Unique (Monorepo)

```yaml
supertube:
  build: ./supertube
  container_name: supertube
  ports:
    - "8080:8080"
  volumes:
    - ./supertube/data:/app/data
    - ./youtube:/youtube
  environment:
    - TZ=Europe/Paris
  depends_on:
    - ytdlp-api
  restart: unless-stopped

ytdlp-api:
  build: ./ytdlp-api
  container_name: ytdlp-api
  volumes:
    - ./youtube:/youtube
  environment:
    - TZ=Europe/Paris
  restart: unless-stopped
```

## Exemples de Volumes

| Usage | Configuration |
|-------|---------------|
| Dossier local | `./youtube:/youtube` |
| NAS | `/mnt/nas/videos:/youtube` |
| Disque externe | `/media/youtube:/youtube` |

---

[Retour au Deploiement](./README.md)
