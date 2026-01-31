# Logs et Metriques de Performance

## Donnees Collectees par Telechargement

| Metrique | Description | Unite |
|----------|-------------|-------|
| `started_at` | Heure de debut | Timestamp |
| `completed_at` | Heure de fin | Timestamp |
| `duration_seconds` | Temps total de telechargement | Secondes |
| `filesize_bytes` | Taille du fichier final | Bytes |
| `avg_speed_bytes` | Vitesse moyenne | Bytes/sec |
| `fragments_total` | Nombre de fragments | Entier |
| `concurrent_fragments` | Parallelisme utilise | Entier |
| `quality` | Resolution telechargee | String (1080p, etc.) |
| `status` | Resultat | completed/failed |
| `error` | Message d'erreur si echec | String |

## Calculs Derives

```typescript
// Vitesse moyenne
avg_speed = filesize_bytes / duration_seconds

// Vitesse formatee
formatSpeed(bytesPerSec) {
  if (bytesPerSec > 1_000_000) return `${(bytesPerSec / 1_000_000).toFixed(1)} Mo/s`
  if (bytesPerSec > 1_000) return `${(bytesPerSec / 1_000).toFixed(1)} Ko/s`
  return `${bytesPerSec} o/s`
}

// Duree formatee
formatDuration(seconds) {
  if (seconds > 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`
  if (seconds > 60) return `${Math.floor(seconds / 60)}min ${seconds % 60}s`
  return `${seconds}s`
}
```

## Affichage dans l'Interface

### Carte Telechargement Termine

```
┌─────────────────────────────────────────┐
│ ✓ Titre de la video                     │
│   Chaine - 1080p                        │
├─────────────────────────────────────────┤
│ 1.2 Go  |  2min 34s  |  8.2 Mo/s        │
└─────────────────────────────────────────┘
```

### Page Historique/Logs

```
┌────────────────────────────────────────────────────────────────┐
│  Historique des telechargements                                │
├────────────────────────────────────────────────────────────────┤
│  [Filtrer]    [Aujourd'hui v]    [Stats]                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ✓ iOS 27 Nouveautes - Marty                    Il y a 5 min  │
│    1080p - 842 Mo - 1min 12s - 11.7 Mo/s                       │
│                                                                │
│  ✓ Tesla Autonome - Xavier                      Il y a 2h     │
│    1080p - 1.4 Go - 3min 45s - 6.4 Mo/s                        │
│                                                                │
│  ✗ Video indisponible                           Hier          │
│    Erreur: Video unavailable                                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Widget Statistiques Globales

```
┌─────────────────────────────────────────┐
│  Statistiques (30 derniers jours)       │
├─────────────────────────────────────────┤
│  Telechargements : 47                   │
│  Volume total    : 52.3 Go              │
│  Temps total     : 1h 23min             │
│  Vitesse moyenne : 7.8 Mo/s             │
│  Taux de succes  : 94%                  │
└─────────────────────────────────────────┘
```

---

[Retour au sommaire](../README.md) | [Precedent : Database](../06-database/) | [Suivant : Securite](../08-securite/)
