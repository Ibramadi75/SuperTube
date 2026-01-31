# Architecture Technique

Vue d'ensemble de l'architecture technique de SuperTube.

## Contenu

- [Stack Technologique](./stack.md) - Technologies utilisees et justifications
- [Conteneurs et Volumes](./containers.md) - Structure Docker et gestion des volumes
- [API yt-dlp](./ytdlp-api.md) - Communication avec le service de telechargement

## Schema Global

```
┌────────────────────────────────────────────┐
│              Docker Network                │
├─────────────┬─────────────┬────────────────┤
│   supertube │   ytdlp-api │    webhook     │
│   (app)     │  (sidecar)  │  (optionnel)   │
│    :8080    │    :3001    │     :9001      │
└─────────────┴─────────────┴────────────────┘
```

> **Note** : Le webhook est optionnel. Il permet l'integration avec les Raccourcis iPhone pour declencher des telechargements a distance.

---

[Retour au sommaire](../README.md) | [Precedent : Introduction](../01-introduction/) | [Suivant : Fonctionnalites](../03-fonctionnalites/)
