# Communication avec yt-dlp

Au lieu de monter le Docker socket (risque de securite), SuperTube communique avec le conteneur yt-dlp via une API HTTP legere.

## Architecture

```
┌─────────────────┐     HTTP POST      ┌─────────────────┐
│   SuperTube     │ ─────────────────► │   yt-dlp API    │
│   Backend       │ ◄───────────────── │   (sidecar)     │
│   :3000         │     SSE/WebSocket  │   :3001         │
└─────────────────┘     (progression)  └─────────────────┘
```

## Conteneur yt-dlp API

```yaml
ytdlp-api:
  build: ./ytdlp-api
  container_name: ytdlp-api
  ports:
    - "3001:3001"
  volumes:
    - ./youtube:/youtube    # Meme volume que le backend
  environment:
    - TZ=Europe/Paris
  restart: unless-stopped
```

## Endpoints

| Methode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/download` | Lance un telechargement |
| `GET` | `/download/:id` | Statut + progression |
| `DELETE` | `/download/:id` | Annule un telechargement |
| `GET` | `/download/:id/stream` | SSE pour progression temps reel |
| `POST` | `/info` | Recupere les metadonnees sans telecharger |
| `POST` | `/update` | Met a jour yt-dlp |

## Progression en temps reel

Le conteneur yt-dlp utilise `--progress-template` pour parser la progression :

```bash
yt-dlp --progress-template "%(progress._percent_str)s %(progress._speed_str)s %(progress._eta_str)s" ...
```

Les donnees sont envoyees au backend SuperTube via Server-Sent Events (SSE) :

```json
{
  "id": "dl_abc123",
  "percent": 45.2,
  "speed": "8.2MiB/s",
  "eta": "00:42",
  "status": "downloading"
}
```

---

[Retour a l'Architecture](./README.md)
