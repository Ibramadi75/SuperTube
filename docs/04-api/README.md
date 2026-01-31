# API REST

Documentation de l'API REST de SuperTube.

## Contenu

- [Videos](./videos.md) - Endpoints pour la gestion des videos
- [Channels](./channels.md) - Endpoints pour les chaines
- [Downloads](./downloads.md) - Endpoints pour les telechargements
- [Settings](./settings.md) - Endpoints pour les parametres
- [Stats](./stats.md) - Endpoints pour les statistiques et le stockage

## Base URL

```
http://localhost:8080/api
```

> L'API est accessible via le meme port que l'interface web. Nginx proxy les requetes `/api/*` vers le backend Node.js.

## Format des Reponses

**Succes :**
```json
{
  "data": { ... }
}
```

**Erreur :**
```json
{
  "error": {
    "code": "VIDEO_NOT_FOUND",
    "message": "Video with id 'xxx' not found"
  }
}
```

**Codes HTTP :**
| Code | Description |
|------|-------------|
| 200 | Succes |
| 201 | Cree |
| 400 | Requete invalide |
| 404 | Ressource non trouvee |
| 500 | Erreur serveur |

## Resume des Endpoints

| Ressource | Endpoints |
|-----------|-----------|
| Videos | `GET /videos`, `GET /videos/:id`, `DELETE /videos/:id`, `GET /videos/:id/stream`, `GET /videos/:id/thumbnail` |
| Channels | `GET /channels`, `GET /channels/:name`, `DELETE /channels/:name` |
| Downloads | `POST /downloads`, `GET /downloads`, `GET /downloads/:id`, `DELETE /downloads/:id` |
| Settings | `GET /settings`, `PUT /settings` |
| Stats | `GET /stats`, `GET /stats/downloads` |
| Logs | `GET /logs`, `GET /logs/:id` |
| Storage | `GET /storage` |

---

[Retour au sommaire](../README.md) | [Precedent : Fonctionnalites](../03-fonctionnalites/) | [Suivant : Interface](../05-interface/)
