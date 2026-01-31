# API Channels

## Endpoints

| Methode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/channels` | Liste toutes les chaines |
| `GET` | `/api/channels/:name` | Videos d'une chaine |
| `DELETE` | `/api/channels/:name` | Supprime une chaine entiere |

## GET /api/channels

Liste toutes les chaines avec leurs statistiques.

**Reponse :**
```json
[
  {
    "name": "Marty",
    "video_count": 12,
    "total_size": 8945678912,
    "last_video_at": "2026-01-31T14:30:00Z"
  },
  {
    "name": "Jokariz",
    "video_count": 5,
    "total_size": 3456789012,
    "last_video_at": "2026-01-30T10:15:00Z"
  }
]
```

## DELETE /api/channels/:name

Supprime toutes les videos d'une chaine.

> **Attention** : Cette action est irreversible.

---

[Retour a l'API](./README.md)
