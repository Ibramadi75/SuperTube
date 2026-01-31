# Stack Technologique

## Technologies

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Frontend | React 18 + Vite | Moderne, rapide, composants reutilisables |
| UI Library | Tailwind CSS | Utility-first, leger, responsive |
| State Management | Zustand ou React Query | Leger, simple |
| Backend | Node.js (Express) ou Go (Fiber) | API REST rapide |
| Base de donnees | SQLite | Fichier unique, leger |
| Conteneurisation | Docker multi-stage | Image optimisee < 100 Mo |

## Structure du Projet

```
supertube/
├── frontend/                 # Application React
│   ├── src/
│   │   ├── components/       # Composants reutilisables
│   │   ├── pages/            # Pages (Dashboard, Library, Settings)
│   │   ├── hooks/            # Custom hooks (useVideos, useDownloads)
│   │   ├── api/              # Appels API
│   │   ├── store/            # State management
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── backend/
│   ├── src/
│   │   ├── routes/           # Routes API
│   │   ├── services/         # Logique metier
│   │   ├── db/               # SQLite
│   │   └── index.ts
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── docs/
```

## Dockerfile Multi-Stage (Frontend)

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## Dockerfile Backend

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

[Retour a l'Architecture](./README.md)
