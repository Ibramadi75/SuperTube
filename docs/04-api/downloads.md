# API Downloads

## Endpoints

| Methode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/downloads` | Lance un telechargement |
| `GET` | `/api/downloads` | Liste les telechargements en cours |
| `GET` | `/api/downloads/:id` | Statut d'un telechargement |
| `DELETE` | `/api/downloads/:id` | Annule un telechargement |

## POST /api/downloads

Lance un nouveau telechargement.

**Requete :**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "quality": "1080p",
  "subtitles": false,
  "sponsorblock": true
}
```

**Reponse :**
```json
{
  "id": "dl_abc123",
  "status": "started",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "started_at": "2026-01-31T14:30:00Z"
}
```

## GET /api/downloads

Liste tous les telechargements en cours.

**Reponse :**
```json
[
  {
    "id": "dl_abc123",
    "status": "downloading",
    "progress": 45,
    "title": "iOS 27 - Marty",
    "started_at": "2026-01-31T14:30:00Z"
  }
]
```

## GET /api/downloads/:id

Retourne le statut detaille d'un telechargement.

**Reponse :**
```json
{
  "id": "dl_abc123",
  "status": "downloading",
  "progress": 45,
  "speed": "8.2MiB/s",
  "eta": "00:42",
  "title": "iOS 27 Nouveautes",
  "uploader": "Marty",
  "started_at": "2026-01-31T14:30:00Z"
}
```

## DELETE /api/downloads/:id

Annule un telechargement en cours.

---

[Retour a l'API](./README.md)
