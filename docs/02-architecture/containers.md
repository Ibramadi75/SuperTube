# Conteneurs et Volumes

## Structure des Conteneurs

```
┌────────────────────────────────────────────┐
│              Docker Network                │
├─────────────┬─────────────┬────────────────┤
│   supertube │   ytdlp-api │    webhook     │
│   (app)     │  (sidecar)  │  (optionnel)   │
│    :8080    │    :3001    │     :9001      │
└─────────────┴─────────────┴────────────────┘
```

> **Note** : Le webhook est optionnel. Il permet l'integration avec les Raccourcis iPhone.

## Volumes

```yaml
volumes:
  - ./supertube/data:/app/data    # Base SQLite + config
  - ./youtube:/youtube            # Videos telechargees (chemin impose)
```

Le chemin `/youtube` dans le conteneur est impose. L'utilisateur monte le dossier de son choix cote hote :

| Exemple | Description |
|---------|-------------|
| `./youtube:/youtube` | Dossier local |
| `/mnt/nas/videos:/youtube` | NAS |
| `/media/youtube:/youtube` | Disque externe |

> **Note securite** : Pas de montage du Docker socket. La communication avec le conteneur yt-dlp se fait via une API HTTP interne (voir [ytdlp-api.md](./ytdlp-api.md)).

---

[Retour a l'Architecture](./README.md)
