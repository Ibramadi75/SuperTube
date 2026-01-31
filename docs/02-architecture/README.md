# Architecture Technique

Vue d'ensemble de l'architecture technique de SuperTube.

## Contenu

- [Stack Technologique](./stack.md) - Technologies utilisees et justifications
- [Conteneurs et Volumes](./containers.md) - Structure Docker et gestion des volumes
- [API yt-dlp](./ytdlp-api.md) - Communication avec le service de telechargement

## Schema Global

```
┌──────────────────────────────────────────────────────────┐
│                     Docker Network                        │
├────────────────────────┬─────────────┬───────────────────┤
│       supertube        │  ytdlp-api  │     webhook       │
│  ┌───────┬──────────┐  │  (sidecar)  │   (optionnel)     │
│  │ nginx │ node API │  │             │                   │
│  │  :80  │  :3000   │  │    :3001    │      :9001        │
│  └───────┴──────────┘  │             │                   │
│         :8080          │   interne   │                   │
└────────────────────────┴─────────────┴───────────────────┘
```

**Ports exposes :**
- `8080` : Interface web (nginx sert le frontend + proxy `/api` vers node)
- `3001` : API yt-dlp (interne, non expose)
- `9001` : Webhook (optionnel, pour Raccourcis iPhone)

---

[Retour au sommaire](../README.md) | [Precedent : Introduction](../01-introduction/) | [Suivant : Fonctionnalites](../03-fonctionnalites/)
