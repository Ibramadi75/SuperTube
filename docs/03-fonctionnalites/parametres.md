# Parametres

## Qualite par Defaut

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

## Format de Sortie

```yaml
format:
  video: "mp4"        # mp4, mkv, webm
  audio: "mp3"        # mp3, m4a, opus
  thumbnail: true     # Telecharger la miniature
  embed_thumbnail: true  # Integrer dans le fichier
```

## Performance Telechargement

```yaml
performance:
  concurrent_fragments: 4    # Fragments telecharges en parallele (1-16)
  rate_limit: null           # Limite de vitesse en Ko/s (null = illimite)
  retries: 3                 # Nombre de tentatives en cas d'echec
```

**Interface :**

```
┌─────────────────────────────────────────┐
│  Performance                            │
├─────────────────────────────────────────┤
│  Fragments simultanes :                 │
│  ┌─────────────────────────────────┐    │
│  │ [====●=======] 4                │    │
│  └─────────────────────────────────┘    │
│  (1 = lent mais stable, 16 = rapide)   │
│                                         │
│  Limite de vitesse :                    │
│  ○ Illimitee (defaut)                   │
│  ○ Personnalisee : [____] Ko/s          │
└─────────────────────────────────────────┘
```

## SponsorBlock

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

## Organisation des Fichiers

```yaml
output:
  template: "%(uploader)s - %(title)s [%(id)s].%(ext)s"  # Tout a plat
  restrict_filenames: false   # Remplacer caracteres speciaux
  windows_filenames: true     # Compatibilite Windows
```

> **Note** : Le dossier de telechargement `/youtube` est impose dans le conteneur. L'utilisateur choisit le dossier reel cote hote via le volume Docker (voir [Conteneurs](../02-architecture/containers.md)).

**Interface Stockage (lecture seule) :**

```
┌─────────────────────────────────────────┐
│  Stockage                               │
├─────────────────────────────────────────┤
│  Espace utilise : 52.3 Go               │
│  Espace libre   : 1.8 To                │
│  Total          : 2.0 To                │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ █████████░░░░░░░░░░░░  2.6%    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## Retention

```yaml
retention:
  enabled: false
  days: 30              # Supprimer apres X jours
  min_free_space: 10    # Go minimum a garder libre
```

## Notifications (optionnel)

```yaml
notifications:
  enabled: false
  type: "apprise"       # apprise, webhook
  url: ""               # URL du serveur Apprise
  on_complete: true     # Notifier quand telechargement termine
  on_error: true        # Notifier en cas d'erreur
```

---

[Retour aux Fonctionnalites](./README.md)
