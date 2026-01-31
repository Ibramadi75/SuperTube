# Schema SQLite

## Tables

### Table videos

Cache des metadonnees des videos.

```sql
CREATE TABLE videos (
    id TEXT PRIMARY KEY,           -- ID YouTube
    title TEXT NOT NULL,
    uploader TEXT NOT NULL,
    duration INTEGER,              -- Duree en secondes
    filepath TEXT NOT NULL,
    thumbnail_path TEXT,
    filesize INTEGER,              -- Taille en bytes
    downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    youtube_url TEXT
);
```

### Table downloads

Historique et telechargements en cours.

```sql
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
    -- Metriques de performance
    filesize_bytes INTEGER,        -- Taille finale du fichier
    duration_seconds INTEGER,      -- Duree du telechargement
    avg_speed_bytes INTEGER,       -- Vitesse moyenne (bytes/sec)
    fragments_total INTEGER,       -- Nombre total de fragments
    fragments_downloaded INTEGER,  -- Fragments telecharges
    quality TEXT,                  -- Qualite telechargee (1080p, 720p, etc.)
    concurrent_fragments INTEGER   -- Parametre utilise
);
```

### Table settings

Parametres de l'application.

```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

## Index

```sql
CREATE INDEX idx_videos_uploader ON videos(uploader);
CREATE INDEX idx_videos_downloaded_at ON videos(downloaded_at DESC);
CREATE INDEX idx_downloads_status ON downloads(status);
```

---

[Retour a la Database](./README.md)
