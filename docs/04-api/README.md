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
http://localhost:3000/api
```

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
