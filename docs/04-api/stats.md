# API Stats et Storage

## Endpoints Statistiques

| Methode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/stats` | Statistiques globales |
| `GET` | `/api/stats/downloads` | Statistiques des telechargements |

## Endpoints Logs

| Methode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/logs` | Historique des telechargements |
| `GET` | `/api/logs/:id` | Details d'un telechargement passe |

## Endpoints Storage

| Methode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/storage` | Info stockage (taille, espace libre) |

## GET /api/storage

**Reponse :**
```json
{
  "download_path": "/youtube",
  "used_bytes": 56182095872,
  "used_formatted": "52.3 Go",
  "free_bytes": 1981547520000,
  "free_formatted": "1.8 To",
  "total_bytes": 2037729615872,
  "total_formatted": "2.0 To",
  "usage_percent": 2.6,
  "video_count": 47
}
```

## GET /api/stats/downloads

**Reponse :**
```json
{
  "period": "30d",
  "total_downloads": 47,
  "successful": 44,
  "failed": 3,
  "total_bytes": 56182095872,
  "total_duration_seconds": 4980,
  "avg_speed_bytes": 8234567,
  "by_quality": {
    "1080p": 38,
    "720p": 6,
    "480p": 3
  },
  "by_day": [
    { "date": "2026-01-31", "count": 5, "bytes": 4200000000 },
    { "date": "2026-01-30", "count": 3, "bytes": 2800000000 }
  ]
}
```

---

[Retour a l'API](./README.md)
