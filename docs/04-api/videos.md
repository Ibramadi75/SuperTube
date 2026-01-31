# API Videos

## Endpoints

| Methode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/videos` | Liste toutes les videos |
| `GET` | `/api/videos/:id` | Details d'une video |
| `DELETE` | `/api/videos/:id` | Supprime une video |
| `GET` | `/api/videos/:id/stream` | Stream la video |
| `GET` | `/api/videos/:id/thumbnail` | Recupere la miniature |

## GET /api/videos

Liste toutes les videos de la bibliotheque.

**Parametres de query :**
- `channel` (optionnel) : Filtrer par chaine
- `limit` (optionnel) : Nombre de resultats (defaut: 50)
- `offset` (optionnel) : Pagination

## GET /api/videos/:id

Retourne les details complets d'une video.

**Reponse :**
```json
{
  "id": "abc123",
  "title": "iOS 27 Nouveautes",
  "uploader": "Marty",
  "duration": 754,
  "filepath": "/youtube/Marty - iOS 27 Nouveautes [abc123].mp4",
  "thumbnail_path": "/youtube/Marty - iOS 27 Nouveautes [abc123]-thumb.jpg",
  "filesize": 892456789,
  "downloaded_at": "2026-01-31T14:30:00Z",
  "youtube_url": "https://www.youtube.com/watch?v=abc123"
}
```

---

[Retour a l'API](./README.md)
