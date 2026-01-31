# Variables d'Environnement

## Conteneur supertube

| Variable | Description | Defaut | Requis |
|----------|-------------|--------|--------|
| `TZ` | Timezone | `UTC` | Non |
| `YTDLP_API_URL` | URL interne de l'API yt-dlp | `http://ytdlp-api:3001` | Oui |
| `ASPNETCORE_URLS` | URL d'ecoute .NET | `http://+:5000` | Non |
| `ASPNETCORE_ENVIRONMENT` | Environnement | `Production` | Non |

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
      - ASPNETCORE_ENVIRONMENT=Production

  ytdlp-api:
    environment:
      - TZ=Europe/Paris
```

## Notes

- Le port externe (8080) est configure dans `ports:` du docker-compose, pas via variable
- .NET ecoute sur le port 5000 par defaut (interne, nginx proxy)
- Le chemin des videos (`/youtube`) est fixe, configure via volume
- Le chemin de la BDD (`/app/data/supertube.db`) est fixe, configure via volume

---

[Retour au Deploiement](./README.md)
