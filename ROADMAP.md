# SuperTube - Roadmap de Developpement

> Derniere mise a jour : 2026-02-01
> Status global : **Phase 9 - COMPLETE ✅** (Docker Production)

---

## Phase 0 : Documentation et Specification ✅

- [x] Rediger le cahier des charges complet
- [x] Definir l'architecture (conteneurs, ports, volumes)
- [x] Documenter l'API REST (endpoints, formats)
- [x] Creer les wireframes des ecrans
- [x] Definir le schema de base de donnees
- [x] Choisir la stack technique (.NET 8 + React)

---

## Phase 1 : Setup Projet

### 1.1 Structure du repository
- [x] Creer le dossier `src/SuperTube.Api/` pour le backend .NET
- [x] Creer le dossier `src/client/` pour le frontend React
- [x] Ajouter `.gitignore` adapte (.NET + Node)
- [x] Ajouter `docker-compose.dev.yml` (avec Dockerfiles dev)

### 1.2 Backend .NET - Projet initial
- [x] `dotnet new web` avec le bon nom de projet
- [x] Configurer le `.csproj` pour AOT (PublishAot, InvariantGlobalization)
- [x] Ajouter les packages NuGet : EF Core SQLite
- [x] Creer `appsettings.json` avec config de base
- [x] Verifier que ca build et demarre sur le port 5000

### 1.3 Frontend React - Projet initial
- [x] `npm create vite@latest` avec template React + TypeScript
- [x] Installer Tailwind CSS et le configurer
- [x] Installer Zustand pour le state management
- [x] Installer React Router pour la navigation
- [x] Configurer le proxy Vite vers `localhost:5000/api` (dev)
- [x] Verifier que ca demarre sur le port 5173

### 1.4 Docker - Configuration dev
- [x] Ecrire `docker-compose.dev.yml` avec hot-reload
- [x] Tester que les 3 services demarrent ensemble
- [x] Verifier la communication frontend -> backend

---

## Phase 2 : Base de Donnees

### 2.1 Modeles EF Core
- [x] Creer l'entite `Video` avec toutes les proprietes
- [x] Creer l'entite `Download` avec les metriques
- [x] Creer l'entite `Setting` (key/value)
- [x] Creer `AppDbContext` avec les DbSet

### 2.2 Configuration EF Core
- [x] Configurer les index dans `OnModelCreating`
- [x] Auto-creation BDD avec `EnsureCreated()` (pas de migrations pour ce projet simple)
- [x] Tester la creation de la BDD au demarrage
- [x] Verifier que le fichier `supertube.db` est bien cree

### 2.3 Seed des donnees de test (dev only)
- [x] Ajouter quelques videos fictives pour tester l'affichage
- [x] Ajouter des settings par defaut (qualite 1080p, etc.)

---

## Phase 3 : API Backend

### 3.1 Structure des endpoints
- [x] Creer le dossier `Endpoints/` avec une classe par ressource
- [x] Creer le dossier `Services/` pour la logique metier
- [x] Creer le dossier `DTOs/` pour les objets de transfert

### 3.2 Endpoint Videos (`/api/videos`)
- [x] `GET /api/videos` - Liste toutes les videos (avec pagination)
- [x] `GET /api/videos/{id}` - Detail d'une video
- [x] `DELETE /api/videos/{id}` - Supprime une video (fichier + BDD)
- [x] `GET /api/videos/{id}/stream` - Stream le fichier video
- [x] `GET /api/videos/{id}/thumbnail` - Retourne la miniature
- [x] Tester chaque endpoint avec curl ou Postman

### 3.3 Endpoint Channels (`/api/channels`)
- [x] `GET /api/channels` - Liste les chaines (groupe par uploader)
- [x] `GET /api/channels/{name}` - Videos d'une chaine
- [x] `DELETE /api/channels/{name}` - Supprime toutes les videos d'une chaine
- [x] Tester chaque endpoint

### 3.4 Endpoint Downloads (`/api/downloads`)
- [x] `POST /api/downloads` - Lance un nouveau telechargement
- [x] `GET /api/downloads` - Liste les telechargements (en cours + historique)
- [x] `GET /api/downloads/{id}` - Detail d'un telechargement
- [x] `DELETE /api/downloads/{id}` - Annule un telechargement en cours
- [x] Tester chaque endpoint

### 3.5 Endpoint Settings (`/api/settings`)
- [x] `GET /api/settings` - Retourne tous les parametres
- [x] `PUT /api/settings` - Met a jour les parametres
- [x] Definir les valeurs par defaut (qualite, format, SponsorBlock)
- [x] Tester chaque endpoint

### 3.6 Endpoint Stats (`/api/stats`)
- [x] `GET /api/stats` - Stats globales (nb videos, taille totale)
- [x] `GET /api/stats/downloads` - Metriques des telechargements recents
- [x] `GET /api/storage` - Espace disque utilise/libre
- [x] Tester chaque endpoint

### 3.7 Endpoint Webhook (`/api/webhook`)
- [x] `GET /api/webhook` - Configuration webhook (URL, token, requiresToken)
- [x] `PUT /api/webhook` - Activer/desactiver l'exigence de token
- [x] `POST /api/webhook/verify` - Verifier un token (pour le conteneur webhook)
- [x] `POST /api/webhook/regenerate` - Regenerer un token aleatoire
- [x] `PUT /api/webhook/token` - Definir un token manuellement
- [x] Tester chaque endpoint

### 3.8 Gestion des erreurs
- [x] Creer un middleware pour les erreurs globales
- [x] Retourner le format d'erreur standard (`{ error: { code, message } }`)
- [x] Logger les erreurs dans la console

---

## Phase 4 : Integration yt-dlp

### 4.1 Communication avec ytdlp-api
- [x] Creer un service `YtdlpService` pour appeler l'API externe
- [x] Implementer l'appel POST pour lancer un telechargement
- [x] Implementer la lecture du flux SSE pour la progression
- [x] Gerer les erreurs de l'API yt-dlp

### 4.2 Gestion de la progression
- [x] Mettre a jour le status du download en BDD pendant le telechargement
- [x] Calculer et stocker les metriques (vitesse, fragments)
- [x] Marquer comme "completed" ou "failed" a la fin

### 4.3 Post-telechargement
- [x] Scanner le fichier telecharge pour extraire les metadonnees
- [x] Creer l'entree dans la table `videos`
- [x] Verifier que la miniature est bien presente

### 4.4 File System Watcher
- [ ] Implementer un watcher sur le dossier `/youtube`
- [ ] Detecter les fichiers ajoutes/supprimes manuellement
- [ ] Synchroniser la BDD avec le filesystem au demarrage

---

## Phase 5 : Frontend - Structure ✅

### 5.1 Layout principal
- [x] Creer le composant `Layout` avec header + contenu
- [x] Creer le composant `Header` avec logo et navigation
- [x] Navigation responsive (icones sur mobile)
- [x] Appliquer le theme sombre (couleurs YouTube)

### 5.2 Routing
- [x] Configurer React Router avec les routes :
  - `/` → Dashboard
  - `/library` → Bibliotheque
  - `/library/:channel` → Videos d'une chaine
  - `/settings` → Parametres
- [x] Ajouter la page 404

### 5.3 State management (Zustand)
- [x] Creer le store principal avec les slices :
  - `videos` : liste des videos, loading, erreurs
  - `downloads` : telechargements en cours
  - `settings` : parametres utilisateur
  - `ui` : channel selectionne, modals ouvertes, toasts

### 5.4 Client API
- [x] Creer `api/client.ts` avec la config fetch
- [x] Creer `api/videos.ts` avec les fonctions d'appel
- [x] Creer `api/downloads.ts`
- [x] Creer `api/settings.ts`
- [x] Creer `api/stats.ts`

---

## Phase 6 : Frontend - Pages ✅

### 6.1 Dashboard (`/`)
- [x] Afficher les stats globales (nb videos, taille)
- [x] Afficher les telechargements en cours avec progression
- [x] Afficher les 6 dernieres videos telechargees
- [x] Ajouter le formulaire de telechargement rapide (URL)
- [x] Bouton "Voir tout" vers la bibliotheque
- [x] Tutoriels mobiles (iOS Shortcuts, Android HTTP Shortcuts) dans un pliant
- [x] Copie URL et token webhook depuis les tutoriels

### 6.2 Bibliotheque (`/library`)
- [x] Sidebar avec la liste des chaines
- [x] Grille de videos responsive (VideoGrid)
- [x] Carte video avec miniature, titre, duree (VideoCard)
- [x] Clic sur une video → ouvre le lecteur (modal)
- [x] Bouton supprimer avec confirmation
- [x] Tri par date (plus recent en premier)

### 6.3 Page Chaine (`/library/:channel`)
- [x] Afficher le nom de la chaine en titre
- [x] Grille des videos de cette chaine uniquement
- [x] Bouton "Supprimer toute la chaine" avec confirmation
- [x] Sidebar pour navigation

### 6.4 Parametres (`/settings`)
- [x] Section Qualite : selecteur 2160p/1080p/720p/480p/audio
- [x] Section Format : choix mp4/mkv/webm, thumbnail oui/non
- [x] Section Performance : selecteur fragments (1-16)
- [x] Section SponsorBlock : toggle on/off, action mark/remove
- [x] Section Stockage : affichage espace utilise/libre (lecture seule)
- [x] Section Webhook Token : toggle exigence token, saisie manuelle, regeneration, copie
- [x] Bouton Sauvegarder
- [x] Navigation par hash (#webhook-token) depuis le Dashboard

### 6.5 Lecteur Video
- [x] Modal avec lecteur HTML5
- [x] Afficher titre, chaine, duree, taille
- [x] Controles natifs du navigateur
- [ ] Chapitres SponsorBlock (si disponibles) - V2
- [x] Bouton fermer (Echap ou clic)

---

## Phase 7 : Frontend - Composants UI ✅

### 7.1 Composants de base
- [x] `Button` : variantes primary, secondary, danger, ghost
- [x] `Input` : texte avec label et erreur
- [x] `Select` : dropdown avec options
- [x] `Toggle` : switch on/off
- [x] `Modal` : conteneur modal reutilisable
- [x] `Toast` : notifications temporaires
- [x] `ProgressBar` : barre de progression

### 7.2 Composants metier
- [x] `VideoCard` : miniature + infos + actions
- [x] `VideoPlayer` : lecteur video avec metadonnees
- [x] `DownloadForm` : formulaire URL + options
- [x] `DownloadProgress` : barre de progression + stats

---

## Phase 8 : Telechargement - UX Complete ✅

### 8.1 Formulaire de telechargement
- [x] Validation URL YouTube en temps reel (regex)
- [x] Afficher erreur si URL invalide
- [x] Options : qualite
- [x] Bouton "Telecharger" disabled si URL invalide
- [x] Toast de confirmation quand le telechargement demarre

### 8.2 Suivi de progression
- [x] Barre de progression avec pourcentage
- [x] Afficher la vitesse en temps reel (Mo/s)
- [x] Afficher le temps restant estime (ETA)
- [x] Afficher les fragments (12/48)
- [x] Bouton annuler

### 8.3 Fin de telechargement
- [x] Toast de succes quand termine
- [x] Rafraichir automatiquement la liste des videos
- [x] En cas d'erreur : toast avec message

---

## Phase 9 : Docker Production ✅

### 9.1 Dockerfile multi-stage
- [x] Stage 1 : Build frontend (node:20-alpine)
- [x] Stage 2 : Build backend (dotnet/sdk:8.0-alpine)
- [x] Stage 3 : Image finale (dotnet/aspnet:8.0-alpine + nginx)
- [x] Image supertube : 151 Mo (runtime .NET ~90 Mo)
- [x] Tester le build complet

### 9.2 Configuration nginx
- [x] Servir les fichiers statiques React
- [x] Proxy `/api` vers le backend .NET
- [x] Gzip compression
- [x] Cache headers pour les assets

### 9.3 docker-compose.yml production
- [x] Service `supertube` avec build et volumes
- [x] Service `ytdlp-api` (build local)
- [x] Service `webhook` pour telechargement mobile
- [x] Network bridge entre les services
- [x] Restart policy `unless-stopped`

### 9.4 Tests de production
- [x] Tester le deploiement from scratch
- [x] Verifier les volumes persistants
- [x] Verifier les logs
- [x] API et frontend fonctionnels sur port 8080

---

## Phase 10 : Polish et Optimisations

### 10.1 Performance
- [ ] Verifier que la RAM reste < 50 Mo
- [ ] Verifier que le chargement initial < 1 seconde
- [ ] Lazy loading des images (miniatures)
- [ ] Pagination des listes si > 50 items

### 10.2 Mobile
- [ ] Tester sur iPhone Safari
- [ ] Tester sur Android Chrome
- [ ] Verifier le touch sur les boutons
- [ ] Verifier le lecteur video mobile

### 10.3 Robustesse
- [ ] Gerer la perte de connexion au backend
- [ ] Gerer les fichiers corrompus/manquants
- [ ] Retry automatique sur erreur reseau
- [ ] Message clair si ytdlp-api est down

### 10.4 UX finale
- [ ] Animations subtiles (transitions de page)
- [ ] Etats vides ("Aucune video", "Aucun telechargement")
- [ ] Skeleton loading pendant le chargement
- [ ] Raccourcis clavier (Echap pour fermer modal)

---

## Phase 11 : Documentation Utilisateur

- [ ] README.md avec screenshots
- [ ] Instructions d'installation (docker-compose up)
- [ ] FAQ : problemes courants
- [ ] Changelog pour les versions

---

## Phase 12 : Notifications Push (Ntfy)

### 12.1 Backend
- [ ] Ajouter settings pour Ntfy (topic, enabled)
- [ ] Envoyer notification a la fin d'un telechargement (succes/echec)
- [ ] Inclure titre de la video dans la notification

### 12.2 Frontend
- [ ] Section Notifications dans Parametres
- [ ] Toggle activer/desactiver
- [ ] Champ topic Ntfy
- [ ] Bouton tester la notification

---

## Backlog V2 (apres la V1)

Ces fonctionnalites ne sont PAS dans le scope V1 :

- [ ] Playlists YouTube (telecharger une playlist entiere)
- [ ] Recherche dans la bibliotheque
- [ ] Filtres (par date, taille, duree)
- [ ] Retention automatique (supprimer apres X jours)
- [ ] Multi-utilisateurs
- [ ] Themes personnalises
- [ ] Import/export des parametres

---

## Notes de Session

_Utilise cette section pour noter ou tu en es quand tu t'arretes :_

**2025-01-31** : Documentation terminee. Stack choisie : .NET 8 + React. Pret a commencer Phase 1.

**2025-01-31** : Phase 1 COMPLETE. Backend .NET + Frontend React + Docker dev tous fonctionnels. Pret pour Phase 2 (migrations BDD) et Phase 3 (API complete).

**2026-01-31** : Phase 4 quasi COMPLETE. Integration yt-dlp fonctionnelle avec:
- API wrapper Python/FastAPI pour yt-dlp
- YtdlpService .NET pour communiquer avec l'API
- DownloadBackgroundService pour traiter les telechargements
- Progression temps reel via SSE
- Creation automatique des entrees Video apres telechargement
- Reste a faire: File System Watcher (4.4)

**2026-01-31** : Phases 5-8 COMPLETE. Frontend React complet:
- Store Zustand avec tous les slices (videos, downloads, settings, ui)
- Client API complet (videos, channels, downloads, settings, stats)
- Pages: Dashboard, Bibliotheque, Chaine, Parametres, 404
- Composants UI: Button, Input, Select, Toggle, Modal, Toast, ProgressBar
- Composants metier: VideoCard, VideoPlayer, DownloadForm, DownloadProgress
- Theme sombre YouTube, responsive, toasts de notification

**2026-02-01** : Integration Webhook pour telechargement mobile:
- Conteneur webhook (adnanh/webhook) avec verification token dynamique
- Endpoints API pour gestion token (GET/PUT/POST /api/webhook/*)
- Token stocke en BDD (pas de restart conteneur necessaire)
- Tutoriels iOS Shortcuts et Android HTTP Shortcuts dans Dashboard
- Gestion token dans Parametres (toggle, saisie manuelle, regeneration)
- Teste avec succes sur iPhone

**2026-02-01** : Phase 9 COMPLETE. Docker Production:
- Dockerfile multi-stage (node + dotnet SDK + runtime)
- nginx avec gzip, cache headers, proxy API
- docker-compose.yml avec 3 services (supertube, ytdlp-api, webhook)
- Network bridge pour communication inter-conteneurs
- Image supertube: 151 Mo, ytdlp-api: 225 Mo, webhook: 21 Mo
- Deploiement teste avec succes sur port 8080

---
