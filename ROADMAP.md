# SuperTube - Roadmap de Developpement

> Derniere mise a jour : 2025-01-31
> Status global : **Phase 1 - COMPLETE ✅**

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
- [ ] Ajouter la migration initiale (`dotnet ef migrations add Initial`)
- [ ] Tester la creation de la BDD au demarrage
- [ ] Verifier que le fichier `supertube.db` est bien cree dans `/app/data`

### 2.3 Seed des donnees de test (dev only)
- [ ] Ajouter quelques videos fictives pour tester l'affichage
- [ ] Ajouter des settings par defaut (qualite 1080p, etc.)

---

## Phase 3 : API Backend

### 3.1 Structure des endpoints
- [x] Creer le dossier `Endpoints/` avec une classe par ressource
- [x] Creer le dossier `Services/` pour la logique metier
- [x] Creer le dossier `DTOs/` pour les objets de transfert

### 3.2 Endpoint Videos (`/api/videos`)
- [ ] `GET /api/videos` - Liste toutes les videos (avec pagination)
- [ ] `GET /api/videos/{id}` - Detail d'une video
- [ ] `DELETE /api/videos/{id}` - Supprime une video (fichier + BDD)
- [ ] `GET /api/videos/{id}/stream` - Stream le fichier video
- [ ] `GET /api/videos/{id}/thumbnail` - Retourne la miniature
- [ ] Tester chaque endpoint avec curl ou Postman

### 3.3 Endpoint Channels (`/api/channels`)
- [ ] `GET /api/channels` - Liste les chaines (groupe par uploader)
- [ ] `GET /api/channels/{name}` - Videos d'une chaine
- [ ] `DELETE /api/channels/{name}` - Supprime toutes les videos d'une chaine
- [ ] Tester chaque endpoint

### 3.4 Endpoint Downloads (`/api/downloads`)
- [ ] `POST /api/downloads` - Lance un nouveau telechargement
- [ ] `GET /api/downloads` - Liste les telechargements (en cours + historique)
- [ ] `GET /api/downloads/{id}` - Detail d'un telechargement
- [ ] `DELETE /api/downloads/{id}` - Annule un telechargement en cours
- [ ] Tester chaque endpoint

### 3.5 Endpoint Settings (`/api/settings`)
- [ ] `GET /api/settings` - Retourne tous les parametres
- [ ] `PUT /api/settings` - Met a jour les parametres
- [ ] Definir les valeurs par defaut (qualite, format, SponsorBlock)
- [ ] Tester chaque endpoint

### 3.6 Endpoint Stats (`/api/stats`)
- [ ] `GET /api/stats` - Stats globales (nb videos, taille totale)
- [ ] `GET /api/stats/downloads` - Metriques des telechargements recents
- [ ] `GET /api/storage` - Espace disque utilise/libre
- [ ] Tester chaque endpoint

### 3.7 Gestion des erreurs
- [ ] Creer un middleware pour les erreurs globales
- [ ] Retourner le format d'erreur standard (`{ error: { code, message } }`)
- [ ] Logger les erreurs dans la console

---

## Phase 4 : Integration yt-dlp

### 4.1 Communication avec ytdlp-api
- [ ] Creer un service `YtdlpService` pour appeler l'API externe
- [ ] Implementer l'appel POST pour lancer un telechargement
- [ ] Implementer la lecture du flux SSE pour la progression
- [ ] Gerer les erreurs de l'API yt-dlp

### 4.2 Gestion de la progression
- [ ] Mettre a jour le status du download en BDD pendant le telechargement
- [ ] Calculer et stocker les metriques (vitesse, fragments)
- [ ] Marquer comme "completed" ou "failed" a la fin

### 4.3 Post-telechargement
- [ ] Scanner le fichier telecharge pour extraire les metadonnees
- [ ] Creer l'entree dans la table `videos`
- [ ] Verifier que la miniature est bien presente

### 4.4 File System Watcher
- [ ] Implementer un watcher sur le dossier `/youtube`
- [ ] Detecter les fichiers ajoutes/supprimes manuellement
- [ ] Synchroniser la BDD avec le filesystem au demarrage

---

## Phase 5 : Frontend - Structure

### 5.1 Layout principal
- [x] Creer le composant `Layout` avec header + contenu
- [x] Creer le composant `Header` avec logo et navigation
- [ ] Creer le composant `MobileNav` (menu hamburger)
- [x] Appliquer le theme sombre (couleurs YouTube)

### 5.2 Routing
- [x] Configurer React Router avec les routes :
  - `/` → Dashboard
  - `/library` → Bibliotheque
  - `/library/:channel` → Videos d'une chaine
  - `/settings` → Parametres
- [x] Ajouter la page 404

### 5.3 State management (Zustand)
- [ ] Creer le store principal avec les slices :
  - `videos` : liste des videos, loading, erreurs
  - `downloads` : telechargements en cours
  - `settings` : parametres utilisateur
  - `ui` : channel selectionne, modals ouvertes

### 5.4 Client API
- [ ] Creer `api/client.ts` avec la config fetch/axios
- [ ] Creer `api/videos.ts` avec les fonctions d'appel
- [ ] Creer `api/downloads.ts`
- [ ] Creer `api/settings.ts`
- [ ] Creer `api/stats.ts`

---

## Phase 6 : Frontend - Pages

### 6.1 Dashboard (`/`)
- [ ] Afficher les stats globales (nb videos, taille)
- [ ] Afficher les telechargements en cours avec progression
- [ ] Afficher les 6 dernieres videos telechargees
- [ ] Ajouter le formulaire de telechargement rapide (URL)
- [ ] Bouton "Voir tout" vers la bibliotheque

### 6.2 Bibliotheque (`/library`)
- [ ] Sidebar avec la liste des chaines
- [ ] Grille de videos responsive (VideoGrid)
- [ ] Carte video avec miniature, titre, duree (VideoCard)
- [ ] Clic sur une video → ouvre le lecteur (modal ou page)
- [ ] Bouton supprimer avec confirmation
- [ ] Tri par date (plus recent en premier)

### 6.3 Page Chaine (`/library/:channel`)
- [ ] Afficher le nom de la chaine en titre
- [ ] Grille des videos de cette chaine uniquement
- [ ] Bouton "Supprimer toute la chaine" avec confirmation
- [ ] Lien retour vers la bibliotheque

### 6.4 Parametres (`/settings`)
- [ ] Section Qualite : selecteur 2160p/1080p/720p/480p/audio
- [ ] Section Format : choix mp4/mkv, thumbnail oui/non
- [ ] Section Performance : slider fragments (1-16), limite vitesse
- [ ] Section SponsorBlock : toggle on/off, action mark/remove
- [ ] Section Stockage : affichage espace utilise/libre (lecture seule)
- [ ] Bouton Sauvegarder

### 6.5 Lecteur Video
- [ ] Modal ou page avec lecteur HTML5
- [ ] Afficher titre, chaine, duree, taille
- [ ] Controles natifs du navigateur
- [ ] Chapitres SponsorBlock (si disponibles)
- [ ] Bouton fermer / retour

---

## Phase 7 : Frontend - Composants UI

### 7.1 Composants de base
- [ ] `Button` : variantes primary, secondary, danger
- [ ] `Input` : texte avec label et erreur
- [ ] `Select` : dropdown avec options
- [ ] `Slider` : pour les valeurs numeriques (fragments)
- [ ] `Toggle` : switch on/off
- [ ] `Modal` : conteneur modal reutilisable
- [ ] `Toast` : notifications temporaires
- [ ] `Spinner` : indicateur de chargement
- [ ] `ConfirmDialog` : confirmation avant action destructive

### 7.2 Composants metier
- [ ] `VideoCard` : miniature + infos + actions
- [ ] `VideoGrid` : grille responsive de VideoCard
- [ ] `VideoPlayer` : lecteur video avec metadonnees
- [ ] `DownloadForm` : formulaire URL + options
- [ ] `DownloadProgress` : barre de progression + stats
- [ ] `DownloadList` : liste des telechargements
- [ ] `ChannelList` : sidebar avec les chaines
- [ ] `ChannelCard` : nom + nombre de videos
- [ ] `StorageBar` : barre d'utilisation disque

---

## Phase 8 : Telechargement - UX Complete

### 8.1 Formulaire de telechargement
- [ ] Validation URL YouTube en temps reel (regex)
- [ ] Afficher erreur si URL invalide
- [ ] Options : qualite, SponsorBlock (herite des settings par defaut)
- [ ] Bouton "Telecharger" disabled si URL invalide
- [ ] Toast de confirmation quand le telechargement demarre

### 8.2 Suivi de progression
- [ ] Barre de progression avec pourcentage
- [ ] Afficher la vitesse en temps reel (Mo/s)
- [ ] Afficher le temps restant estime
- [ ] Afficher les fragments (12/48)
- [ ] Bouton annuler

### 8.3 Fin de telechargement
- [ ] Toast de succes avec lien vers la video
- [ ] Rafraichir automatiquement la liste des videos
- [ ] En cas d'erreur : toast avec message, retry possible

---

## Phase 9 : Docker Production

### 9.1 Dockerfile multi-stage
- [ ] Stage 1 : Build frontend (node:20-alpine)
- [ ] Stage 2 : Build backend AOT (dotnet/sdk:8.0-alpine)
- [ ] Stage 3 : Image finale (alpine:3.19 + nginx + binaire)
- [ ] Verifier que l'image fait < 50 Mo
- [ ] Tester le build complet

### 9.2 Configuration nginx
- [ ] Servir les fichiers statiques React
- [ ] Proxy `/api` vers le backend .NET
- [ ] Gzip compression
- [ ] Cache headers pour les assets

### 9.3 docker-compose.yml production
- [ ] Service `supertube` avec build et volumes
- [ ] Service `ytdlp-api` (image externe ou build)
- [ ] Network interne entre les services
- [ ] Restart policy `unless-stopped`

### 9.4 Tests de production
- [ ] Tester le deploiement from scratch
- [ ] Verifier les volumes persistants
- [ ] Verifier les logs
- [ ] Tester un cycle complet : telecharger, regarder, supprimer

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

## Backlog V2 (apres la V1)

Ces fonctionnalites ne sont PAS dans le scope V1 :

- [ ] Playlists YouTube (telecharger une playlist entiere)
- [ ] Recherche dans la bibliotheque
- [ ] Filtres (par date, taille, duree)
- [ ] Retention automatique (supprimer apres X jours)
- [ ] Notifications (Apprise, webhook)
- [ ] Multi-utilisateurs
- [ ] Themes personnalises
- [ ] Import/export des parametres

---

## Notes de Session

_Utilise cette section pour noter ou tu en es quand tu t'arretes :_

**2025-01-31** : Documentation terminee. Stack choisie : .NET 8 + React. Pret a commencer Phase 1.

**2025-01-31** : Phase 1 COMPLETE. Backend .NET + Frontend React + Docker dev tous fonctionnels. Pret pour Phase 2 (migrations BDD) et Phase 3 (API complete).

---
