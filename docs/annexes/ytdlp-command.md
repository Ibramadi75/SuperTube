# Commande yt-dlp

## Commande Complete

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
    -o "thumbnail:/youtube/%(uploader)s - %(title)s [%(id)s]-thumb.%(ext)s" \
    --embed-thumbnail \
    --embed-metadata \
    --sponsorblock-mark sponsor,intro,outro,selfpromo,preview,filler,interaction \
    -o "/youtube/%(uploader)s - %(title)s [%(id)s].%(ext)s" \
    "$URL"
```

> **Note** : `--no-progress` a ete remplace par `--newline` et `--progress-template` pour permettre le suivi de progression en temps reel. La sortie est parsee par l'API yt-dlp et transmise au frontend via SSE.

## Parametres Configurables

| Parametre | Option yt-dlp | Valeur par defaut |
|-----------|---------------|-------------------|
| Fragments paralleles | `--concurrent-fragments` | 4 |
| Qualite max | `--format-sort res:` | 1080 |
| Format video | `--remux-video` | mp4 |
| SponsorBlock | `--sponsorblock-mark` | Active |
| Sous-titres | `--write-subs` | Desactive |

---

[Retour aux Annexes](./README.md)
