# Cahier des Charges - SuperTube

> Interface web légère pour télécharger et gérer des vidéos YouTube

## 1. Contexte et Objectifs

### 1.1 Contexte
SuperTube est une application autonome permettant de télécharger et gérer des vidéos YouTube. Elle peut s'intégrer à une infrastructure existante (webhook, Jellyfin, etc.) ou fonctionner de manière indépendante. Les vidéos sont stockées à plat avec le format `Uploader - Titre [ID].mp4` dans un dossier configurable par l'utilisateur.

### 1.2 Objectif
Créer une interface web ultra-légère permettant de :
- Consulter les vidéos téléchargées
- Lancer de nouveaux téléchargements
- Gérer les paramètres de téléchargement
- Supprimer des vidéos

### 1.3 Contraintes
- **Légèreté** : Empreinte mémoire < 50 Mo
- **Rapidité** : Temps de chargement < 1 seconde
- **Simplicité** : Interface minimaliste, mobile-first
- **Indépendance** : Fonctionne sans Pinchflat

---

## 2. Architecture Technique

### 2.1 Stack Technologique
| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Frontend | React 18 + Vite | Moderne, rapide, composants réutilisables |
| UI Library | Tailwind CSS | Utility-first, léger, responsive |
| State Management | Zustand ou React Query | Léger, simple |
| Backend | Node.js (Express) ou Go (Fiber) | API REST rapide |
| Base de données | SQLite | Fichier unique, léger |
| Conteneurisation | Docker multi-stage | Image optimisée < 100 Mo |

### 2.1.1 Structure du Projet
```
supertube/
├── frontend/                 # Application React
│   ├── src/
│   │   ├── components/       # Composants réutilisables
│   │   ├── pages/            # Pages (Dashboard, Library, Settings)
│   │   ├── hooks/            # Custom hooks (useVideos, useDownloads)
│   │   ├── api/              # Appels API
│   │   ├── store/            # State management
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── backend/
│   ├── src/
│   │   ├── routes/           # Routes API
│   │   ├── services/         # Logique métier
│   │   ├── db/               # SQLite
│   │   └── index.ts
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── CAHIER_DES_CHARGES.md
```

### 2.1.2 Dockerfile Multi-Stage (Frontend)
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 2.1.3 Dockerfile Backend
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 2.2 Structure des Conteneurs
```
┌─────────────────────────────────────────────────────────┐
│                      Docker Network                     │
├─────────────┬─────────────┬─────────────┬───────────────┤
│   supertube │    ytdlp    │   webhook   │   jellyfin    │
│   (nouveau) │  (existant) │  (existant) │   (existant)  │
│    :8080    │             │    :9001    │     :8096     │
└─────────────┴─────────────┴─────────────┴───────────────┘
```

### 2.3 Volumes
```yaml
volumes:
  - ./supertube/data:/app/data    # Base SQLite + config
  - ./youtube:/youtube            # Vidéos téléchargées (chemin imposé)
```

Le chemin `/youtube` dans le conteneur est imposé. L'utilisateur monte le dossier de son choix côté hôte :
- `./youtube:/youtube` (dossier local)
- `/mnt/nas/videos:/youtube` (NAS)
- `/media/youtube:/youtube` (disque externe)

> **Note sécurité** : Pas de montage du Docker socket. La communication avec le conteneur yt-dlp se fait via une API HTTP interne (voir section 2.4).

### 2.4 Communication avec yt-dlp

Au lieu de monter le Docker socket (risque de sécurité), SuperTube communique avec le conteneur yt-dlp via une API HTTP légère.

#### 2.4.1 Architecture
```
┌─────────────────┐     HTTP POST      ┌─────────────────┐
│   SuperTube     │ ─────────────────► │   yt-dlp API    │
│   Backend       │ ◄───────────────── │   (sidecar)     │
│   :3000         │     SSE/WebSocket  │   :3001         │
└─────────────────┘     (progression)  └─────────────────┘
```

#### 2.4.2 Conteneur yt-dlp API
```yaml
ytdlp-api:
  build: ./ytdlp-api
  container_name: ytdlp-api
  ports:
    - "3001:3001"
  volumes:
    - ./youtube:/youtube    # Même volume que le backend
  environment:
    - TZ=Europe/Paris
  restart: unless-stopped
```

#### 2.4.3 Endpoints yt-dlp API
```
POST   /download              # Lance un téléchargement
GET    /download/:id          # Statut + progression
DELETE /download/:id          # Annule un téléchargement
GET    /download/:id/stream   # SSE pour progression temps réel
POST   /info                  # Récupère les métadonnées sans télécharger
POST   /update                # Met à jour yt-dlp
```

#### 2.4.4 Progression en temps réel
Le conteneur yt-dlp utilise `--progress-template` pour parser la progression :
```bash
yt-dlp --progress-template "%(progress._percent_str)s %(progress._speed_str)s %(progress._eta_str)s" ...
```

Les données sont envoyées au backend SuperTube via Server-Sent Events (SSE) :
```json
{
  "id": "dl_abc123",
  "percent": 45.2,
  "speed": "8.2MiB/s",
  "eta": "00:42",
  "status": "downloading"
}
```

---

## 3. Fonctionnalités Détaillées

### 3.1 Dashboard (Page d'accueil)

#### 3.1.1 Statistiques
- Nombre total de vidéos
- Espace disque utilisé / espace libre
- Barre de progression visuelle du stockage
- Nombre de chaînes/uploaders
- Téléchargements en cours
- Vitesse moyenne des derniers téléchargements

#### 3.1.2 Téléchargements Récents
- Liste des 10 dernières vidéos téléchargées
- Affichage : Thumbnail, Titre, Chaîne, Date, Durée

#### 3.1.3 Téléchargements en Cours
- Liste des téléchargements actifs
- Barre de progression (si possible)
- Bouton annuler

---

### 3.2 Bibliothèque

#### 3.2.1 Navigation par Chaîne
```
/downloads/Manual/
├── Marty/
│   ├── Video 1.mp4
│   └── Video 2.mp4
├── Jokariz/
│   └── Video 3.mp4
└── Rick Astley/
    └── Video 4.mp4
```

#### 3.2.2 Liste des Chaînes
| Élément | Description |
|---------|-------------|
| Nom de la chaîne | Nom du dossier |
| Nombre de vidéos | Count des fichiers .mp4 |
| Espace utilisé | Taille totale du dossier |
| Dernière vidéo | Date de la plus récente |

#### 3.2.3 Liste des Vidéos (dans une chaîne)
| Élément | Description |
|---------|-------------|
| Thumbnail | Image .jpg associée |
| Titre | Extrait du nom de fichier |
| ID YouTube | Extrait entre crochets [xxx] |
| Taille | Taille du fichier |
| Date | Date de téléchargement |
| Actions | Lire, Supprimer, Ouvrir sur YouTube |

#### 3.2.4 Lecteur Vidéo
- Lecteur HTML5 intégré
- Barre de progression cliquable
- Contrôle volume
- Plein écran
- Vitesse de lecture (0.5x, 1x, 1.5x, 2x)

---

### 3.3 Nouveau Téléchargement

#### 3.3.1 Formulaire
```
┌─────────────────────────────────────────┐
│  Télécharger une vidéo                  │
├─────────────────────────────────────────┤
│  URL YouTube :                          │
│  ┌─────────────────────────────────┐    │
│  │ https://youtube.com/watch?v=... │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Qualité : ○ 1080p (défaut)             │
│            ○ 720p                       │
│            ○ 480p                       │
│            ○ Audio uniquement           │
│                                         │
│  ☐ Télécharger les sous-titres          │
│  ☐ Marquer SponsorBlock                 │
│                                         │
│  [ Télécharger ]                        │
└─────────────────────────────────────────┘
```

#### 3.3.2 Validation
- Vérifier que l'URL est une URL YouTube valide
- Formats acceptés :
  - `https://www.youtube.com/watch?v=XXXXX`
  - `https://youtu.be/XXXXX`
  - `https://youtube.com/shorts/XXXXX`

#### 3.3.3 Feedback
- Afficher "Téléchargement démarré"
- Rediriger vers le dashboard avec le téléchargement en cours visible
- Notification quand terminé (si navigateur ouvert)

---

### 3.4 Paramètres

#### 3.4.1 Qualité par Défaut
```yaml
quality:
  default: "1080p"
  options:
    - "2160p"  # 4K
    - "1080p"  # Full HD
    - "720p"   # HD
    - "480p"   # SD
    - "audio"  # Audio uniquement (MP3)
```

#### 3.4.2 Format de Sortie
```yaml
format:
  video: "mp4"        # mp4, mkv, webm
  audio: "mp3"        # mp3, m4a, opus
  thumbnail: true     # Télécharger la miniature
  embed_thumbnail: true  # Intégrer dans le fichier
```

#### 3.4.3 Performance Téléchargement
```yaml
performance:
  concurrent_fragments: 4    # Fragments téléchargés en parallèle (1-16)
  rate_limit: null           # Limite de vitesse en Ko/s (null = illimité)
  retries: 3                 # Nombre de tentatives en cas d'échec
```

**Interface :**
```
┌─────────────────────────────────────────┐
│  Performance                            │
├─────────────────────────────────────────┤
│  Fragments simultanés :                 │
│  ┌─────────────────────────────────┐    │
│  │ [====●=======] 4                │    │
│  └─────────────────────────────────┘    │
│  (1 = lent mais stable, 16 = rapide)   │
│                                         │
│  Limite de vitesse :                    │
│  ○ Illimitée (défaut)                   │
│  ○ Personnalisée : [____] Ko/s          │
└─────────────────────────────────────────┘
```

#### 3.4.4 SponsorBlock
```yaml
sponsorblock:
  enabled: true
  action: "mark"      # mark, remove
  categories:
    - sponsor
    - intro
    - outro
    - selfpromo
    - preview
    - filler
    - interaction
```

#### 3.4.5 Organisation des Fichiers
```yaml
output:
  template: "%(uploader)s - %(title)s [%(id)s].%(ext)s"  # Tout à plat
  restrict_filenames: false   # Remplacer caractères spéciaux
  windows_filenames: true     # Compatibilité Windows
```

> **Note** : Le dossier de téléchargement `/youtube` est imposé dans le conteneur. L'utilisateur choisit le dossier réel côté hôte via le volume Docker (voir section 2.3).

**Interface Stockage (lecture seule) :**
```
┌─────────────────────────────────────────┐
│  Stockage                               │
├─────────────────────────────────────────┤
│  📊 Espace utilisé : 52.3 Go            │
│  📁 Espace libre   : 1.8 To             │
│  📈 Total          : 2.0 To             │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ █████████░░░░░░░░░░░░  2.6%    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

#### 3.4.6 Rétention
```yaml
retention:
  enabled: false
  days: 30              # Supprimer après X jours
  min_free_space: 10    # Go minimum à garder libre
```

#### 3.4.7 Notifications (optionnel)
```yaml
notifications:
  enabled: false
  type: "apprise"       # apprise, webhook
  url: ""               # URL du serveur Apprise
  on_complete: true     # Notifier quand téléchargement terminé
  on_error: true        # Notifier en cas d'erreur
```

---

## 4. API REST

### 4.1 Endpoints

#### 4.1.1 Vidéos
```
GET    /api/videos                    # Liste toutes les vidéos
GET    /api/videos/:id                # Détails d'une vidéo
DELETE /api/videos/:id                # Supprime une vidéo
GET    /api/videos/:id/stream         # Stream la vidéo
GET    /api/videos/:id/thumbnail      # Récupère la miniature
```

#### 4.1.2 Chaînes
```
GET    /api/channels                  # Liste toutes les chaînes
GET    /api/channels/:name            # Vidéos d'une chaîne
DELETE /api/channels/:name            # Supprime une chaîne entière
```

#### 4.1.3 Téléchargements
```
POST   /api/downloads                 # Lance un téléchargement
GET    /api/downloads                 # Liste les téléchargements en cours
GET    /api/downloads/:id             # Statut d'un téléchargement
DELETE /api/downloads/:id             # Annule un téléchargement
```

#### 4.1.4 Paramètres
```
GET    /api/settings                  # Récupère les paramètres
PUT    /api/settings                  # Met à jour les paramètres
```

#### 4.1.5 Statistiques
```
GET    /api/stats                     # Statistiques globales
GET    /api/stats/downloads           # Statistiques des téléchargements
```

#### 4.1.6 Logs de Téléchargement
```
GET    /api/logs                      # Historique des téléchargements
GET    /api/logs/:id                  # Détails d'un téléchargement passé
```

#### 4.1.7 Stockage
```
GET    /api/storage                   # Info stockage (taille, espace libre)
GET    /api/storage/path              # Chemin actuel du dossier
PUT    /api/storage/path              # Modifier le chemin du dossier
```

**Réponse GET /api/storage :**
```json
{
  "download_path": "/downloads",
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

### 4.2 Exemples de Requêtes

#### Lancer un téléchargement
```bash
POST /api/downloads
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "quality": "1080p",
  "subtitles": false,
  "sponsorblock": true
}
```

#### Réponse
```json
{
  "id": "dl_abc123",
  "status": "started",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "started_at": "2026-01-31T14:30:00Z"
}
```

---

## 5. Interface Utilisateur

### 5.1 Design System

#### 5.1.1 Couleurs
```css
:root {
  --bg-primary: #0f0f0f;       /* Fond principal (noir) */
  --bg-secondary: #1a1a1a;     /* Fond cartes */
  --bg-tertiary: #272727;      /* Fond hover */
  --text-primary: #ffffff;     /* Texte principal */
  --text-secondary: #aaaaaa;   /* Texte secondaire */
  --accent: #ff0000;           /* Rouge YouTube */
  --accent-hover: #cc0000;     /* Rouge hover */
  --success: #2ecc71;          /* Vert succès */
  --error: #e74c3c;            /* Rouge erreur */
}
```

#### 5.1.2 Typographie
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
font-size: 14px;              /* Base */
font-size: 16px;              /* Titres cartes */
font-size: 20px;              /* Titres pages */
```

#### 5.1.3 Composants
- **Cartes** : Coins arrondis (8px), ombre légère
- **Boutons** : Padding 12px 24px, coins arrondis (4px)
- **Inputs** : Bordure 1px, fond sombre, focus avec accent

### 5.2 Responsive Design

#### 5.2.1 Breakpoints
```css
/* Mobile */
@media (max-width: 640px) { ... }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { ... }

/* Desktop */
@media (min-width: 1025px) { ... }
```

#### 5.2.2 Grille Vidéos
| Device | Colonnes | Taille carte |
|--------|----------|--------------|
| Mobile | 1 | 100% |
| Tablet | 2 | 50% |
| Desktop | 3-4 | 25-33% |

### 5.3 Composants React

#### 5.3.1 Arborescence des Composants
```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx           # Barre de navigation
│   │   ├── Sidebar.tsx          # Menu latéral (desktop)
│   │   └── MobileNav.tsx        # Navigation mobile
│   ├── video/
│   │   ├── VideoCard.tsx        # Carte vidéo (thumbnail, titre, durée)
│   │   ├── VideoGrid.tsx        # Grille de vidéos responsive
│   │   ├── VideoPlayer.tsx      # Lecteur vidéo HTML5
│   │   └── VideoDetails.tsx     # Modal détails vidéo
│   ├── download/
│   │   ├── DownloadForm.tsx     # Formulaire nouveau téléchargement
│   │   ├── DownloadProgress.tsx # Barre de progression
│   │   └── DownloadList.tsx     # Liste téléchargements en cours
│   ├── channel/
│   │   ├── ChannelList.tsx      # Liste des chaînes
│   │   └── ChannelCard.tsx      # Carte chaîne
│   ├── settings/
│   │   ├── SettingsForm.tsx     # Formulaire paramètres
│   │   ├── QualitySelector.tsx  # Sélecteur qualité
│   │   └── SponsorBlockConfig.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Toast.tsx
│       ├── Spinner.tsx
│       └── ConfirmDialog.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Library.tsx
│   ├── Channel.tsx              # Vidéos d'une chaîne
│   ├── Settings.tsx
│   └── NotFound.tsx
├── hooks/
│   ├── useVideos.ts             # Fetch/cache vidéos
│   ├── useDownloads.ts          # Gestion téléchargements
│   ├── useSettings.ts           # Paramètres
│   └── useToast.ts              # Notifications
├── api/
│   ├── client.ts                # Axios/fetch config
│   ├── videos.ts                # API vidéos
│   ├── downloads.ts             # API téléchargements
│   └── settings.ts              # API paramètres
└── store/
    └── useStore.ts              # Zustand store
```

#### 5.3.2 Composant VideoCard
```tsx
interface VideoCardProps {
  id: string;
  title: string;
  uploader: string;
  thumbnail: string;
  duration: number;
  filesize: number;
  downloadedAt: string;
  onPlay: () => void;
  onDelete: () => void;
}

// Affiche : thumbnail, titre tronqué, chaîne, durée formatée
// Actions : hover → boutons Play/Delete
```

#### 5.3.3 Composant DownloadForm
```tsx
interface DownloadFormProps {
  onSubmit: (url: string, options: DownloadOptions) => void;
  isLoading: boolean;
}

interface DownloadOptions {
  quality: '2160p' | '1080p' | '720p' | '480p' | 'audio';
  subtitles: boolean;
  sponsorblock: boolean;
}

// Validation URL YouTube en temps réel
// Preview du titre si possible (optionnel)
```

#### 5.3.4 State Management (Zustand)
```tsx
interface AppState {
  // Videos
  videos: Video[];
  isLoadingVideos: boolean;
  fetchVideos: () => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;

  // Downloads
  downloads: Download[];
  addDownload: (url: string, options: DownloadOptions) => Promise<void>;
  cancelDownload: (id: string) => Promise<void>;

  // Settings
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;

  // UI
  selectedChannel: string | null;
  setSelectedChannel: (channel: string | null) => void;
}
```

### 5.4 Wireframes

#### 5.3.1 Dashboard Mobile
```
┌─────────────────────────┐
│  ☰  SuperTube   ⚙ │
├─────────────────────────┤
│  ┌─────────┬─────────┐  │
│  │ 42      │ 1.2 TB  │  │
│  │ Vidéos  │ Utilisé │  │
│  └─────────┴─────────┘  │
├─────────────────────────┤
│  Téléchargements (1)    │
│  ┌─────────────────────┐│
│  │ ████████░░ 80%      ││
│  │ iOS 27 - Marty      ││
│  └─────────────────────┘│
├─────────────────────────┤
│  Récents                │
│  ┌─────────────────────┐│
│  │ 🖼 Titre vidéo 1    ││
│  │    Chaîne • 12 min  ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ 🖼 Titre vidéo 2    ││
│  │    Chaîne • 8 min   ││
│  └─────────────────────┘│
├─────────────────────────┤
│  [ + Télécharger ]      │
└─────────────────────────┘
```

#### 5.3.2 Bibliothèque Desktop
```
┌────────────────────────────────────────────────────────────────┐
│  ☰  SuperTube          🔍 Rechercher...              ⚙   │
├──────────┬─────────────────────────────────────────────────────┤
│          │                                                     │
│ Chaînes  │  Marty (12 vidéos)                                 │
│          │                                                     │
│ • Marty  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ • Jokariz│  │   🖼     │ │   🖼     │ │   🖼     │           │
│ • Rick.. │  │ Titre 1  │ │ Titre 2  │ │ Titre 3  │           │
│          │  │ 12:34    │ │ 8:21     │ │ 15:02    │           │
│          │  └──────────┘ └──────────┘ └──────────┘           │
│          │                                                     │
│          │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│          │  │   🖼     │ │   🖼     │ │   🖼     │           │
│          │  │ Titre 4  │ │ Titre 5  │ │ Titre 6  │           │
│          │  │ 22:15    │ │ 5:43     │ │ 18:30    │           │
│          │  └──────────┘ └──────────┘ └──────────┘           │
│          │                                                     │
└──────────┴─────────────────────────────────────────────────────┘
```

---

## 6. Base de Données

### 6.1 Schéma SQLite

```sql
-- Table des vidéos (cache des métadonnées)
CREATE TABLE videos (
    id TEXT PRIMARY KEY,           -- ID YouTube
    title TEXT NOT NULL,
    uploader TEXT NOT NULL,
    duration INTEGER,              -- Durée en secondes
    filepath TEXT NOT NULL,
    thumbnail_path TEXT,
    filesize INTEGER,              -- Taille en bytes
    downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    youtube_url TEXT
);

-- Table des téléchargements (historique + en cours)
CREATE TABLE downloads (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, downloading, completed, failed
    progress INTEGER DEFAULT 0,    -- 0-100
    title TEXT,
    uploader TEXT,
    error TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    -- Métriques de performance
    filesize_bytes INTEGER,        -- Taille finale du fichier
    duration_seconds INTEGER,      -- Durée du téléchargement
    avg_speed_bytes INTEGER,       -- Vitesse moyenne (bytes/sec)
    fragments_total INTEGER,       -- Nombre total de fragments
    fragments_downloaded INTEGER,  -- Fragments téléchargés
    quality TEXT,                  -- Qualité téléchargée (1080p, 720p, etc.)
    concurrent_fragments INTEGER   -- Paramètre utilisé
);

-- Table des paramètres
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Index pour performances
CREATE INDEX idx_videos_uploader ON videos(uploader);
CREATE INDEX idx_videos_downloaded_at ON videos(downloaded_at DESC);
CREATE INDEX idx_downloads_status ON downloads(status);
```

### 6.2 Synchronisation Fichiers ↔ Base

#### 6.2.1 File System Watcher
Plutôt qu'un scan périodique (coûteux avec une grande bibliothèque), SuperTube utilise un **watcher** sur le dossier `/downloads` :

- **Linux** : inotify via `chokidar` ou `fs.watch`
- **macOS** : FSEvents
- **Événements surveillés** : création, suppression, renommage de fichiers `.mp4` et `-thumb.jpg`

```typescript
// Exemple avec chokidar
import chokidar from 'chokidar';

const watcher = chokidar.watch('/downloads', {
  ignored: /^\./,
  persistent: true,
  ignoreInitial: false,  // Scanner au démarrage
  awaitWriteFinish: {
    stabilityThreshold: 2000,  // Attendre 2s après la dernière écriture
    pollInterval: 100
  }
});

watcher
  .on('add', path => syncVideoToDatabase(path))
  .on('unlink', path => removeVideoFromDatabase(path));
```

#### 6.2.2 Comportement
- **Au démarrage** : Scan initial complet de `/downloads/`
- **En continu** : Réaction immédiate aux changements (ajout/suppression)
- **À chaque téléchargement terminé** : Le watcher détecte automatiquement le nouveau fichier
- **Fallback** : Si le watcher échoue, scan périodique toutes les 5 min en backup

---

## 7. Logs et Métriques de Performance

### 7.1 Données Collectées par Téléchargement

| Métrique | Description | Unité |
|----------|-------------|-------|
| `started_at` | Heure de début | Timestamp |
| `completed_at` | Heure de fin | Timestamp |
| `duration_seconds` | Temps total de téléchargement | Secondes |
| `filesize_bytes` | Taille du fichier final | Bytes |
| `avg_speed_bytes` | Vitesse moyenne | Bytes/sec |
| `fragments_total` | Nombre de fragments | Entier |
| `concurrent_fragments` | Parallélisme utilisé | Entier |
| `quality` | Résolution téléchargée | String (1080p, etc.) |
| `status` | Résultat | completed/failed |
| `error` | Message d'erreur si échec | String |

### 7.2 Calculs Dérivés

```typescript
// Vitesse moyenne
avg_speed = filesize_bytes / duration_seconds

// Vitesse formatée
formatSpeed(bytesPerSec) {
  if (bytesPerSec > 1_000_000) return `${(bytesPerSec / 1_000_000).toFixed(1)} Mo/s`
  if (bytesPerSec > 1_000) return `${(bytesPerSec / 1_000).toFixed(1)} Ko/s`
  return `${bytesPerSec} o/s`
}

// Durée formatée
formatDuration(seconds) {
  if (seconds > 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`
  if (seconds > 60) return `${Math.floor(seconds / 60)}min ${seconds % 60}s`
  return `${seconds}s`
}
```

### 7.3 Affichage dans l'Interface

#### 7.3.1 Carte Téléchargement Terminé
```
┌─────────────────────────────────────────┐
│ ✓ Titre de la vidéo                     │
│   Chaîne • 1080p                        │
├─────────────────────────────────────────┤
│ 📁 1.2 Go  ⏱ 2min 34s  ⚡ 8.2 Mo/s     │
└─────────────────────────────────────────┘
```

#### 7.3.2 Page Historique/Logs
```
┌────────────────────────────────────────────────────────────────┐
│  Historique des téléchargements                                │
├────────────────────────────────────────────────────────────────┤
│  🔍 Filtrer    📅 Aujourd'hui ▼    📊 Stats                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ✓ iOS 27 Nouveautés - Marty                    Il y a 5 min │
│    1080p • 842 Mo • 1min 12s • 11.7 Mo/s                      │
│                                                                │
│  ✓ Tesla Autonome - Xavier                      Il y a 2h    │
│    1080p • 1.4 Go • 3min 45s • 6.4 Mo/s                       │
│                                                                │
│  ✗ Vidéo indisponible                           Hier         │
│    Erreur: Video unavailable                                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### 7.3.3 Widget Statistiques Globales
```
┌─────────────────────────────────────────┐
│  📊 Statistiques (30 derniers jours)    │
├─────────────────────────────────────────┤
│  Téléchargements : 47                   │
│  Volume total    : 52.3 Go              │
│  Temps total     : 1h 23min             │
│  Vitesse moyenne : 7.8 Mo/s             │
│  Taux de succès  : 94%                  │
└─────────────────────────────────────────┘
```

### 7.4 API Statistiques

#### GET /api/stats/downloads
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

## 8. Sécurité

### 8.1 Réseau
- Accessible uniquement sur le réseau local
- Pas d'authentification par défaut (réseau de confiance)
- Option : Basic Auth si exposé

> **⚠️ Avertissement** : SuperTube est conçu pour un usage sur réseau local privé uniquement. **Ne jamais exposer directement sur Internet** sans :
> - Activer l'authentification (Basic Auth ou reverse proxy avec auth)
> - Utiliser HTTPS (via reverse proxy type Traefik/Nginx)
> - Configurer un pare-feu approprié

### 8.2 Validation des Entrées
- Sanitizer les URLs avant passage à yt-dlp
- Échapper les caractères spéciaux
- Limiter la longueur des URLs (max 500 caractères)

### 8.3 Filesystem
- Empêcher le path traversal (`../`)
- Lecture seule sur `/downloads` sauf suppression explicite
- Pas d'exécution de commandes arbitraires

---

## 9. Déploiement

### 9.1 Docker Compose
```yaml
# Frontend React (Nginx)
supertube-frontend:
  build: ./supertube/frontend
  container_name: supertube-frontend
  ports:
    - "8080:80"
  depends_on:
    - supertube-backend
  restart: unless-stopped

# Backend API
supertube-backend:
  build: ./supertube/backend
  container_name: supertube-backend
  ports:
    - "3000:3000"
  volumes:
    - ./supertube/data:/app/data
    - ./youtube:/youtube
  environment:
    - TZ=Europe/Paris
    - YTDLP_API_URL=http://ytdlp-api:3001
  depends_on:
    - ytdlp-api
  restart: unless-stopped

# yt-dlp API (sidecar)
ytdlp-api:
  build: ./ytdlp-api
  container_name: ytdlp-api
  volumes:
    - ./youtube:/youtube
  environment:
    - TZ=Europe/Paris
  restart: unless-stopped
```

### 9.1.1 Alternative : Image Unique (Monorepo)
```yaml
supertube:
  build: ./supertube
  container_name: supertube
  ports:
    - "8080:8080"
  volumes:
    - ./supertube/data:/app/data
    - ./youtube:/youtube
  environment:
    - TZ=Europe/Paris
  depends_on:
    - ytdlp-api
  restart: unless-stopped

ytdlp-api:
  build: ./ytdlp-api
  container_name: ytdlp-api
  volumes:
    - ./youtube:/youtube
  environment:
    - TZ=Europe/Paris
  restart: unless-stopped
```

### 9.2 Variables d'Environnement
```bash
PORT=8080                    # Port d'écoute
DATA_PATH=/app/data          # Chemin base de données
YTDLP_API_URL=http://ytdlp-api:3001  # URL de l'API yt-dlp
TZ=Europe/Paris              # Timezone
```

---

## 10. Évolutions Futures (Hors Scope V1)

- [ ] Authentification utilisateur
- [ ] Support playlists YouTube
- [ ] Téléchargement programmé (cron)
- [ ] Import/Export des paramètres
- [ ] Thème clair/sombre
- [ ] PWA (installation sur mobile)
- [ ] Intégration Jellyfin (rafraîchir bibliothèque)
- [ ] Historique des téléchargements supprimés
- [ ] Statistiques avancées (graphiques)

---

## 11. Critères de Validation

### 10.1 Performance
- [ ] Démarrage < 5 secondes
- [ ] Mémoire < 50 Mo au repos
- [ ] Chargement page < 1 seconde
- [ ] API response < 200ms

### 10.2 Fonctionnel
- [ ] Lister toutes les vidéos
- [ ] Lire une vidéo dans le navigateur
- [ ] Lancer un téléchargement
- [ ] Voir progression téléchargement
- [ ] Supprimer une vidéo
- [ ] Modifier les paramètres

### 10.3 Compatibilité
- [ ] Chrome/Safari/Firefox
- [ ] iOS Safari
- [ ] Responsive mobile/desktop

---

## 12. Annexes

### 12.1 Structure des Fichiers Téléchargés
```
/downloads/                              # ./youtube sur l'hôte
├── {Uploader} - {Titre} [{ID}].mp4     # Vidéo
├── {Uploader} - {Titre} [{ID}]-thumb.jpg  # Thumbnail (format Jellyfin)
└── ...
```

**Exemple concret :**
```
/downloads/
├── Marty - iOS 27 Nouveautés [abc123].mp4
├── Marty - iOS 27 Nouveautés [abc123]-thumb.jpg
├── Xavier - Tesla Autonome [def456].mp4
├── Xavier - Tesla Autonome [def456]-thumb.jpg
└── ...
```

**Avantages de cette structure :**
- Tout au même niveau (pas de sous-dossiers)
- Tri alphabétique = tri par chaîne
- Jellyfin reconnaît les fichiers `-thumb.jpg`
- Date de publication dans les métadonnées du fichier

### 12.2 Commande yt-dlp Actuelle
```bash
yt-dlp \
    --newline \
    --progress-template "download:[%(progress._percent_str)s] %(progress._speed_str)s ETA:%(progress._eta_str)s" \
    --concurrent-fragments 4 \
    --remux-video mp4 \
    --format-sort res:1080,+codec:avc:m4a \
    --format "bestvideo*+bestaudio/best" \
    --write-thumbnail \
    --convert-thumbnail jpg \
    -o "thumbnail:/downloads/%(uploader)s - %(title)s [%(id)s]-thumb.%(ext)s" \
    --embed-thumbnail \
    --embed-metadata \
    --sponsorblock-mark sponsor,intro,outro,selfpromo,preview,filler,interaction \
    -o "/downloads/%(uploader)s - %(title)s [%(id)s].%(ext)s" \
    "$URL"
```

> **Note** : `--no-progress` a été remplacé par `--newline` et `--progress-template` pour permettre le suivi de progression en temps réel. La sortie est parsée par l'API yt-dlp et transmise au frontend via SSE.

**Paramètres configurables via l'interface :**
| Paramètre | Option yt-dlp | Valeur par défaut |
|-----------|---------------|-------------------|
| Fragments parallèles | `--concurrent-fragments` | 4 |
| Qualité max | `--format-sort res:` | 1080 |
| Format vidéo | `--remux-video` | mp4 |
| SponsorBlock | `--sponsorblock-mark` | Activé |
| Sous-titres | `--write-subs` | Désactivé |

### 12.3 URLs de l'Infrastructure
| Service | URL |
|---------|-----|
| SuperTube | http://192.168.1.85:8080 |
| Webhook | http://192.168.1.85:9001 |
| Jellyfin | http://192.168.1.85:8096 |
| Pinchflat | http://192.168.1.85:8945 |

---

## 13. Fonctionnalités à Étudier

Liste de fonctionnalités potentielles à évaluer pour les versions futures.

### 13.1 Priorité Haute (Essentiels)

| Fonctionnalité | Description | Complexité |
|----------------|-------------|------------|
| **File d'attente** | Gérer plusieurs téléchargements simultanés (FIFO, priorités, limite de parallélisme) | Moyenne |
| **Détection de doublons** | Vérifier si la vidéo (par ID YouTube) existe déjà avant de télécharger | Faible |
| **Retry automatique** | Relancer automatiquement un téléchargement échoué (configurable : 1-5 tentatives) | Faible |
| **Mise à jour yt-dlp** | Bouton pour mettre à jour yt-dlp dans le conteneur (YouTube change souvent ses APIs) | Faible |
| **Prévisualisation** | Avant téléchargement : afficher titre, chaîne, durée, taille estimée, thumbnail | Moyenne |

### 13.2 Priorité Moyenne (Pratiques)

| Fonctionnalité | Description | Complexité |
|----------------|-------------|------------|
| **Recherche** | Barre de recherche pour filtrer les vidéos par titre, chaîne, date | Faible |
| **Refresh Jellyfin auto** | Déclencher automatiquement un scan Jellyfin après chaque téléchargement terminé | Faible |
| **Cookies YouTube** | Importer des cookies pour éviter le throttling et accéder aux vidéos privées/âge-restricted | Moyenne |
| **Téléchargement audio** | Option pour télécharger uniquement l'audio (MP3/M4A) - podcasts, musique | Faible |
| **Sous-titres** | Option pour télécharger les sous-titres (auto-générés ou manuels) | Faible |

### 13.3 Priorité Basse (Nice to Have)

| Fonctionnalité | Description | Complexité |
|----------------|-------------|------------|
| **Drag & drop URL** | Glisser-déposer une URL YouTube pour lancer un téléchargement | Faible |
| **Historique des URLs** | Garder un historique des URLs téléchargées pour éviter les doublons accidentels | Faible |
| **Webhook sortant** | Notifier un service externe (Home Assistant, Discord, etc.) quand un téléchargement termine | Moyenne |
| **Export/Import config** | Sauvegarder et restaurer les paramètres de l'application | Faible |
| **Raccourcis clavier** | Navigation et actions rapides au clavier (desktop) | Faible |
| **Mode hors-ligne** | PWA avec cache pour consulter la bibliothèque sans connexion | Haute |
| **Multi-sources** | Support d'autres plateformes (Vimeo, Twitch, etc.) via yt-dlp | Moyenne |
| **Planification** | Programmer un téléchargement à une heure précise | Moyenne |
| **Quotas** | Limiter l'espace disque utilisé, supprimer automatiquement les plus anciennes vidéos | Moyenne |
