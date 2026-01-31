# Fonctionnalites a Etudier

Liste de fonctionnalites potentielles a evaluer pour les versions futures.

## Priorite Haute (Essentiels)

| Fonctionnalite | Description | Complexite |
|----------------|-------------|------------|
| **File d'attente** | Gerer plusieurs telechargements simultanes (FIFO, priorites, limite de parallelisme) | Moyenne |
| **Detection de doublons** | Verifier si la video (par ID YouTube) existe deja avant de telecharger | Faible |
| **Retry automatique** | Relancer automatiquement un telechargement echoue (configurable : 1-5 tentatives) | Faible |
| **Mise a jour yt-dlp** | Bouton pour mettre a jour yt-dlp dans le conteneur (YouTube change souvent ses APIs) | Faible |
| **Previsualisation** | Avant telechargement : afficher titre, chaine, duree, taille estimee, thumbnail | Moyenne |

## Priorite Moyenne (Pratiques)

| Fonctionnalite | Description | Complexite |
|----------------|-------------|------------|
| **Recherche** | Barre de recherche pour filtrer les videos par titre, chaine, date | Faible |
| **Refresh Jellyfin auto** | Declencher automatiquement un scan Jellyfin apres chaque telechargement termine | Faible |
| **Cookies YouTube** | Importer des cookies pour eviter le throttling et acceder aux videos privees/age-restricted | Moyenne |
| **Telechargement audio** | Option pour telecharger uniquement l'audio (MP3/M4A) - podcasts, musique | Faible |
| **Sous-titres** | Option pour telecharger les sous-titres (auto-generes ou manuels) | Faible |

## Priorite Basse (Nice to Have)

| Fonctionnalite | Description | Complexite |
|----------------|-------------|------------|
| **Drag & drop URL** | Glisser-deposer une URL YouTube pour lancer un telechargement | Faible |
| **Historique des URLs** | Garder un historique des URLs telechargees pour eviter les doublons accidentels | Faible |
| **Webhook sortant** | Notifier un service externe (Home Assistant, Discord, etc.) quand un telechargement termine | Moyenne |
| **Export/Import config** | Sauvegarder et restaurer les parametres de l'application | Faible |
| **Raccourcis clavier** | Navigation et actions rapides au clavier (desktop) | Faible |
| **Mode hors-ligne** | PWA avec cache pour consulter la bibliotheque sans connexion | Haute |
| **Multi-sources** | Support d'autres plateformes (Vimeo, Twitch, etc.) via yt-dlp | Moyenne |
| **Planification** | Programmer un telechargement a une heure precise | Moyenne |
| **Quotas** | Limiter l'espace disque utilise, supprimer automatiquement les plus anciennes videos | Moyenne |

---

[Retour a la Roadmap](./README.md)
