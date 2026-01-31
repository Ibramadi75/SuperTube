# Synchronisation Fichiers / Base

## File System Watcher

Plutot qu'un scan periodique (couteux avec une grande bibliotheque), SuperTube utilise un **watcher** sur le dossier `/youtube` :

- **Linux** : inotify via `chokidar` ou `fs.watch`
- **macOS** : FSEvents
- **Evenements surveilles** : creation, suppression, renommage de fichiers `.mp4` et `-thumb.jpg`

## Implementation

```typescript
import chokidar from 'chokidar';

const watcher = chokidar.watch('/youtube', {
  ignored: /^\./,
  persistent: true,
  ignoreInitial: false,  // Scanner au demarrage
  awaitWriteFinish: {
    stabilityThreshold: 2000,  // Attendre 2s apres la derniere ecriture
    pollInterval: 100
  }
});

watcher
  .on('add', path => syncVideoToDatabase(path))
  .on('unlink', path => removeVideoFromDatabase(path));
```

## Comportement

| Evenement | Action |
|-----------|--------|
| **Au demarrage** | Scan initial complet de `/youtube/` |
| **En continu** | Reaction immediate aux changements (ajout/suppression) |
| **Telechargement termine** | Le watcher detecte automatiquement le nouveau fichier |
| **Fallback** | Si le watcher echoue, scan periodique toutes les 5 min en backup |

---

[Retour a la Database](./README.md)
