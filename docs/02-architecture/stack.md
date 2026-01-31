# Stack Technologique

## Technologies

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Frontend | React 18 + Vite | Moderne, rapide, composants reutilisables |
| UI | Tailwind CSS | Utility-first, leger, responsive |
| State | Zustand | Leger, simple, pas de boilerplate |
| Backend | Node.js + Express | API REST simple, meme langage que le front |
| BDD | SQLite | Fichier unique, zero config, leger |
| Conteneur | Docker multi-stage | Image optimisee < 100 Mo |

## Structure du Projet

```
supertube/
├── src/
│   ├── client/              # Frontend React
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── store/
│   │   └── App.tsx
│   └── server/              # Backend Node.js
│       ├── routes/
│       ├── services/
│       ├── db/
│       └── index.ts
├── package.json
├── vite.config.ts
├── Dockerfile
├── nginx.conf
└── docker-compose.yml
```

## Dockerfile (Multi-Stage)

```dockerfile
# Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:client

# Build backend
FROM node:20-alpine AS backend
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/server ./src/server
RUN npm run build:server

# Production
FROM node:20-alpine
WORKDIR /app

# Nginx pour servir le frontend + proxy API
RUN apk add --no-cache nginx

COPY --from=frontend /app/dist/client /usr/share/nginx/html
COPY --from=backend /app/dist/server ./server
COPY --from=backend /app/node_modules ./node_modules
COPY nginx.conf /etc/nginx/http.d/default.conf

EXPOSE 80
CMD ["sh", "-c", "nginx && node server/index.js"]
```

## nginx.conf

```nginx
server {
    listen 80;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

---

[Retour a l'Architecture](./README.md)
