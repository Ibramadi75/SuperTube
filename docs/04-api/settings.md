# API Settings

## Endpoints

| Methode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/settings` | Recupere les parametres |
| `PUT` | `/api/settings` | Met a jour les parametres |

## GET /api/settings

Retourne la configuration actuelle.

**Reponse :**
```json
{
  "quality": {
    "default": "1080p"
  },
  "format": {
    "video": "mp4",
    "audio": "mp3",
    "thumbnail": true,
    "embed_thumbnail": true
  },
  "performance": {
    "concurrent_fragments": 4,
    "rate_limit": null,
    "retries": 3
  },
  "sponsorblock": {
    "enabled": true,
    "action": "mark",
    "categories": ["sponsor", "intro", "outro"]
  }
}
```

## PUT /api/settings

Met a jour un ou plusieurs parametres.

**Requete :**
```json
{
  "quality": {
    "default": "720p"
  },
  "performance": {
    "concurrent_fragments": 8
  }
}
```

---

[Retour a l'API](./README.md)
