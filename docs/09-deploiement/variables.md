# Variables d'Environnement

## Conteneur supertube

| Variable | Description | Defaut | Requis |
|----------|-------------|--------|--------|
| `TZ` | Timezone | `UTC` | Non |
| `YTDLP_API_URL` | URL interne de l'API yt-dlp | `http://ytdlp-api:3001` | Oui |
| `NODE_ENV` | Environnement Node.js | `production` | Non |
| `LOG_LEVEL` | Niveau de log (debug, info, warn, error) | `info` | Non |

## Conteneur ytdlp-api

| Variable | Description | Defaut | Requis |
|----------|-------------|--------|--------|
| `TZ` | Timezone | `UTC` | Non |

## Exemple docker-compose.yml

```yaml
services:
  supertube:
    environment:
      - TZ=Europe/Paris
      - YTDLP_API_URL=http://ytdlp-api:3001
      - LOG_LEVEL=info

  ytdlp-api:
    environment:
      - TZ=Europe/Paris
```

## Notes

- Le port externe (8080) est configure dans `ports:` du docker-compose, pas via variable
- Le chemin des videos (`/youtube`) est fixe, configure via volume
- Le chemin de la BDD (`/app/data`) est fixe, configure via volume

---

[Retour au Deploiement](./README.md)
