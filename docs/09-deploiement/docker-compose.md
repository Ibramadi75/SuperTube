# Docker Compose

## Configuration Recommandee

```yaml
version: "3.8"

services:
  supertube:
    build: ./supertube
    container_name: supertube
    ports:
      - "8080:80"
    volumes:
      - ./data:/app/data
      - ./youtube:/youtube
    environment:
      - TZ=Europe/Paris
      - YTDLP_API_URL=http://ytdlp-api:3001
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

**Architecture interne du conteneur `supertube` :**
- Nginx sur le port 80 (expose en 8080)
- Sert les fichiers statiques React
- Proxy `/api/*` vers .NET API (port 5000 interne)

## Avec Webhook (optionnel)

Pour declencher des telechargements depuis les Raccourcis iPhone :

```yaml
version: "3.8"

services:
  supertube:
    # ... (meme config que ci-dessus)

  ytdlp-api:
    # ... (meme config que ci-dessus)

  webhook:
    image: almir/webhook
    container_name: supertube-webhook
    ports:
      - "9001:9000"
    volumes:
      - ./webhook:/etc/webhook
    environment:
      - TZ=Europe/Paris
    restart: unless-stopped
```

Voir [Webhook](./webhook.md) pour la configuration.

## Volumes

| Volume | Conteneur | Description |
|--------|-----------|-------------|
| `./data:/app/data` | supertube | Base SQLite + config |
| `./youtube:/youtube` | supertube, ytdlp-api | Videos telechargees |

---

[Retour au Deploiement](./README.md)
