# Structure des Fichiers Telecharges

## Format

```
/youtube/                                    # Volume monte
├── {Uploader} - {Titre} [{ID}].mp4          # Video
├── {Uploader} - {Titre} [{ID}]-thumb.jpg    # Thumbnail (format Jellyfin)
└── ...
```

## Exemple

```
/youtube/
├── Marty - iOS 27 Nouveautes [abc123].mp4
├── Marty - iOS 27 Nouveautes [abc123]-thumb.jpg
├── Xavier - Tesla Autonome [def456].mp4
├── Xavier - Tesla Autonome [def456]-thumb.jpg
└── ...
```

## Avantages

- Tout au meme niveau (pas de sous-dossiers)
- Tri alphabetique = tri par chaine
- Jellyfin reconnait les fichiers `-thumb.jpg`
- Date de publication dans les metadonnees du fichier

---

[Retour aux Annexes](./README.md)
