# SuperTube - Guide pour Claude

> Interface web legere pour telecharger et gerer des videos YouTube

## Structure de la Documentation

Toute la documentation du projet se trouve dans `docs/`. Voici ou trouver chaque information :

```
docs/
├── README.md                           # Index principal, quick start
├── 01-introduction/
│   └── README.md                       # Contexte, objectifs, contraintes
├── 02-architecture/
│   ├── README.md                       # Vue d'ensemble architecture
│   ├── stack.md                        # Stack techno (React, Node, SQLite, Docker)
│   ├── containers.md                   # Structure conteneurs et volumes
│   └── ytdlp-api.md                    # Communication avec yt-dlp (API HTTP, SSE)
├── 03-fonctionnalites/
│   ├── README.md                       # Vue d'ensemble fonctionnalites
│   ├── dashboard.md                    # Page d'accueil, stats, telechargements recents
│   ├── bibliotheque.md                 # Navigation videos, lecteur
│   ├── telechargement.md               # Formulaire, validation URL
│   └── parametres.md                   # Qualite, format, SponsorBlock, stockage
├── 04-api/
│   ├── README.md                       # Vue d'ensemble API REST
│   ├── videos.md                       # GET/DELETE /api/videos
│   ├── channels.md                     # GET/DELETE /api/channels
│   ├── downloads.md                    # POST/GET/DELETE /api/downloads
│   ├── settings.md                     # GET/PUT /api/settings
│   └── stats.md                        # /api/stats, /api/storage, /api/logs
├── 05-interface/
│   ├── README.md                       # Principes UI (mobile-first, dark theme)
│   ├── design-system.md                # Couleurs, typo, composants de base
│   ├── responsive.md                   # Breakpoints, grilles
│   ├── components.md                   # Arborescence composants React, interfaces TS
│   └── wireframes.md                   # Maquettes ASCII des ecrans
├── 06-database/
│   ├── README.md                       # Vue d'ensemble SQLite
│   ├── schema.md                       # Tables videos, downloads, settings + index
│   └── sync.md                         # File System Watcher (chokidar)
├── 07-logs-metriques/
│   └── README.md                       # Metriques telechargement, calculs, affichage
├── 08-securite/
│   └── README.md                       # Reseau, validation entrees, filesystem
├── 09-deploiement/
│   ├── README.md                       # Quick start
│   ├── docker-compose.md               # Configuration Docker recommandee
│   ├── variables.md                    # Variables d'environnement
│   └── webhook.md                      # Integration Raccourcis iPhone
├── 10-roadmap/
│   ├── README.md                       # Evolutions futures V1
│   └── fonctionnalites-futures.md      # Backlog priorise avec complexite
├── 11-validation/
│   └── README.md                       # Criteres performance, fonctionnel, compatibilite
└── annexes/
    ├── README.md                       # Index annexes
    ├── structure-fichiers.md           # Format fichiers telecharges
    ├── ytdlp-command.md                # Commande yt-dlp complete
    └── urls-infrastructure.md          # URLs services (exemple)
```

## Recherche Rapide

| Tu cherches... | Regarde dans... |
|----------------|-----------------|
| Stack technique | `docs/02-architecture/stack.md` |
| Endpoints API | `docs/04-api/` |
| Schema BDD | `docs/06-database/schema.md` |
| Composants React | `docs/05-interface/components.md` |
| Docker Compose | `docs/09-deploiement/docker-compose.md` |
| Commande yt-dlp | `docs/annexes/ytdlp-command.md` |
| Contraintes projet | `docs/01-introduction/` |
| Securite | `docs/08-securite/` |

## Conventions du Projet

- **Frontend** : React 18 + Vite + Tailwind CSS + Zustand
- **Backend** : Node.js (Express) + SQLite
- **Conteneurs** : Docker multi-stage, image < 100 Mo
- **Volume videos** : `/youtube` (chemin impose dans le conteneur)
- **Communication yt-dlp** : API HTTP (pas de Docker socket)
- **Structure fichiers** : A plat, format `Uploader - Titre [ID].mp4`

## Contraintes Cles

- Memoire < 50 Mo
- Chargement page < 1 seconde
- Mobile-first
- Theme sombre (palette YouTube)

## Architecture Reseau

```
Port 8080 (expose)
    │
    ▼
┌─────────────────────┐
│  nginx (port 80)    │
│  ├─ /*     → static │
│  └─ /api/* → :3000  │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  node (port 3000)   │──────► ytdlp-api (port 3001)
│  API REST           │        interne
└─────────────────────┘
```

## Points Importants

- **API base URL** : `http://localhost:8080/api` (pas 3000)
- **Un seul conteneur** supertube (nginx + node dedans)
- **Webhook optionnel** pour Raccourcis iPhone (port 9001)
- **SponsorBlock "mark"** = chapitres dans le lecteur (pas de coupure)
