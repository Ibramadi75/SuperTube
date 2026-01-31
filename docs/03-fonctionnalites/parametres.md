# Parametres

Configuration de l'application via l'interface Settings.

## Qualite par Defaut

| Option | Description |
|--------|-------------|
| 2160p | 4K (si disponible) |
| **1080p** | Full HD (defaut) |
| 720p | HD |
| 480p | SD |
| audio | MP3 uniquement |

## Format de Sortie

| Parametre | Valeur | Description |
|-----------|--------|-------------|
| Format video | mp4 | Compatible tous navigateurs |
| Format audio | mp3 | Pour telechargements audio only |
| Thumbnail | oui | Telecharge l'image miniature |
| Embed thumbnail | oui | Integre la miniature dans le fichier video |

## Performance

| Parametre | Plage | Defaut | Description |
|-----------|-------|--------|-------------|
| Fragments simultanes | 1-16 | 4 | Plus = plus rapide mais moins stable |
| Limite vitesse | 0-illimite | illimite | En Ko/s, 0 = pas de limite |
| Retries | 1-5 | 3 | Tentatives en cas d'echec |

## SponsorBlock

Marque automatiquement les segments sponsorises dans la video.

| Parametre | Options | Description |
|-----------|---------|-------------|
| Actif | oui/non | Active le marquage SponsorBlock |
| Action | **mark** / remove | `mark` = chapitres dans le lecteur, `remove` = coupe les segments |

**Categories detectees :**
- sponsor (pub)
- intro/outro
- selfpromo (auto-promotion)
- preview (teaser)
- filler (remplissage)
- interaction (like/subscribe)

## Stockage

Affichage en lecture seule :
- Espace utilise
- Espace libre
- Pourcentage utilisation

> Le chemin `/youtube` est fixe dans le conteneur. Pour changer le dossier reel, modifier le volume dans `docker-compose.yml`.

---

[Retour aux Fonctionnalites](./README.md)
