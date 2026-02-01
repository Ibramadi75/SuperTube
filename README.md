# SuperTube

> Téléchargez des vidéos YouTube depuis votre téléphone, regardez-les sur Jellyfin

![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)
![License](https://img.shields.io/badge/License-MIT-green)

## Pourquoi SuperTube ?

Vous regardez une vidéo YouTube sur votre téléphone. Vous voulez la garder pour plus tard.

**Avant** : Copier l'URL, ouvrir un PC, lancer yt-dlp, transférer le fichier...

**Avec SuperTube** : Menu partage → SuperTube → C'est téléchargé. Disponible dans Jellyfin.

## Comment ça marche

```
iPhone/Android                    Serveur                         Jellyfin
     │                               │                                │
     │  Partager → SuperTube         │                                │
     ├──────────────────────────────►│                                │
     │                               │  Télécharge via yt-dlp         │
     │  Notification "Terminé"       │                                │
     │◄──────────────────────────────┤                                │
     │                               │                                │
     │                               │  Fichier dans ./supertube-videos/
     │                               ├───────────────────────────────►│
     │                               │                                │
     │                          Regarder sur Jellyfin                 │
     │◄───────────────────────────────────────────────────────────────┤
```

## Installation

### 1. Lancer SuperTube

```bash
curl -O https://raw.githubusercontent.com/Ibramadi75/SuperTube/main/docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d
```

### 2. Configurer Jellyfin

Dans Jellyfin, ajoutez une bibliothèque de type "Vidéos" pointant vers :

```
./supertube-videos/
```

Les vidéos sont nommées `Uploader - Titre [ID].mp4` pour une bonne organisation.

### 3. Configurer le raccourci iPhone

1. Ouvrez l'app **Raccourcis**
2. Créez un nouveau raccourci :
   - Action : **Obtenir le contenu de l'URL**
   - URL : `http://VOTRE_IP:9001/hooks/download`
   - Méthode : `POST`
   - Corps : JSON avec `{"url": "[Entrée du raccourci]"}`
3. Activez **Afficher dans la feuille de partage**
4. Partagez une vidéo YouTube → Choisissez votre raccourci

### 4. Recevoir les notifications

1. Installez **Ntfy** sur votre téléphone ([iOS](https://apps.apple.com/app/ntfy/id1625396347) / [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy))
2. Dans SuperTube → Paramètres → Notifications
3. Activez et entrez un topic (ex: `supertube-votrenom`)
4. Abonnez-vous à ce topic dans l'app Ntfy

Vous recevrez une notification quand le téléchargement démarre et quand il est terminé.

## Configuration Android

1. Installez **HTTP Shortcuts** depuis le Play Store
2. Créez un nouveau raccourci :
   - URL : `http://VOTRE_IP:9001/hooks/download`
   - Méthode : `POST`
   - Corps : `{"url": "{url}"}`
3. Activez le partage

## Ports et volumes

| Port | Usage |
|------|-------|
| 8080 | Interface web |
| 9001 | Webhook pour raccourcis mobiles |

| Dossier | Contenu |
|---------|---------|
| `./supertube-data/` | Base de données |
| `./supertube-videos/` | Vidéos (à pointer vers Jellyfin) |

## Fonctionnalités

- Téléchargement depuis le menu de partage du téléphone
- Notifications push (début et fin de téléchargement)
- Intégration Jellyfin/Plex native
- Interface web pour gérer la bibliothèque
- SponsorBlock (marque les segments sponsorisés)
- Qualité jusqu'à 4K

## Licence

MIT
