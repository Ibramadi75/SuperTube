# Securite

## Reseau

- Accessible uniquement sur le reseau local
- Pas d'authentification par defaut (reseau de confiance)
- Option : Basic Auth si expose

> **Avertissement** : SuperTube est concu pour un usage sur reseau local prive uniquement. **Ne jamais exposer directement sur Internet** sans :
> - Activer l'authentification (Basic Auth ou reverse proxy avec auth)
> - Utiliser HTTPS (via reverse proxy type Traefik/Nginx)
> - Configurer un pare-feu approprie

## Validation des Entrees

- Sanitizer les URLs avant passage a yt-dlp
- Echapper les caracteres speciaux
- Limiter la longueur des URLs (max 500 caracteres)

## Filesystem

- Empecher le path traversal (`../`)
- Lecture seule sur `/youtube` sauf suppression explicite
- Pas d'execution de commandes arbitraires

## Docker

- Pas de montage du Docker socket (voir [Architecture](../02-architecture/ytdlp-api.md))
- Communication via API HTTP avec le sidecar yt-dlp
- Isolation des conteneurs

---

[Retour au sommaire](../README.md) | [Precedent : Logs](../07-logs-metriques/) | [Suivant : Deploiement](../09-deploiement/)
