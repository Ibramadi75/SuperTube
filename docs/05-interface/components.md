# Composants React

## Arborescence des Composants

```
src/client/
├── components/
│   ├── layout/
│   │   ├── Header.tsx           # Barre de navigation
│   │   ├── Sidebar.tsx          # Menu lateral (desktop)
│   │   └── MobileNav.tsx        # Navigation mobile
│   ├── video/
│   │   ├── VideoCard.tsx        # Carte video (thumbnail, titre, duree)
│   │   ├── VideoGrid.tsx        # Grille de videos responsive
│   │   ├── VideoPlayer.tsx      # Lecteur video HTML5
│   │   └── VideoDetails.tsx     # Modal details video
│   ├── download/
│   │   ├── DownloadForm.tsx     # Formulaire nouveau telechargement
│   │   ├── DownloadProgress.tsx # Barre de progression
│   │   └── DownloadList.tsx     # Liste telechargements en cours
│   ├── channel/
│   │   ├── ChannelList.tsx      # Liste des chaines
│   │   └── ChannelCard.tsx      # Carte chaine
│   ├── settings/
│   │   ├── SettingsForm.tsx     # Formulaire parametres
│   │   ├── QualitySelector.tsx  # Selecteur qualite
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
│   ├── Channel.tsx              # Videos d'une chaine
│   ├── Settings.tsx
│   └── NotFound.tsx
├── hooks/
│   ├── useVideos.ts             # Fetch/cache videos
│   ├── useDownloads.ts          # Gestion telechargements
│   ├── useSettings.ts           # Parametres
│   └── useToast.ts              # Notifications
├── api/
│   ├── client.ts                # Axios/fetch config
│   ├── videos.ts                # API videos
│   ├── downloads.ts             # API telechargements
│   └── settings.ts              # API parametres
└── store/
    └── useStore.ts              # Zustand store
```

## Composant VideoCard

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

// Affiche : thumbnail, titre tronque, chaine, duree formatee
// Actions : hover -> boutons Play/Delete
```

## Composant DownloadForm

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

// Validation URL YouTube en temps reel
// Preview du titre si possible (optionnel)
```

## State Management (Zustand)

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

---

[Retour a l'Interface](./README.md)
