# SuperTube - Documentation

> Interface web legere pour telecharger et gerer des videos YouTube

## Sommaire

### Specifications

| Section | Description |
|---------|-------------|
| [01 - Introduction](./01-introduction/) | Contexte, objectifs et contraintes du projet |
| [02 - Architecture](./02-architecture/) | Stack technique, conteneurs et communication |
| [03 - Fonctionnalites](./03-fonctionnalites/) | Dashboard, bibliotheque, telechargement, parametres |
| [04 - API](./04-api/) | Endpoints REST (videos, channels, downloads, settings) |
| [05 - Interface](./05-interface/) | Design system, composants React, wireframes |
| [06 - Base de donnees](./06-database/) | Schema SQLite et synchronisation fichiers |
| [07 - Logs et metriques](./07-logs-metriques/) | Collecte de donnees et statistiques |
| [08 - Securite](./08-securite/) | Reseau, validation, filesystem |
| [09 - Deploiement](./09-deploiement/) | Docker Compose et variables d'environnement |

### Planification

| Section | Description |
|---------|-------------|
| [10 - Roadmap](./10-roadmap/) | Evolutions futures et fonctionnalites a etudier |
| [11 - Validation](./11-validation/) | Criteres de validation (performance, fonctionnel, compatibilite) |

### References

| Section | Description |
|---------|-------------|
| [Annexes](./annexes/) | Structure fichiers, commande yt-dlp, URLs infrastructure |

## Quick Start

```bash
# Cloner le repo
git clone https://github.com/user/supertube.git
cd supertube

# Lancer avec Docker Compose
docker-compose up -d

# Acceder a l'interface
open http://localhost:8080
```

## Contraintes Principales

- **Legerete** : Empreinte memoire < 50 Mo
- **Rapidite** : Temps de chargement < 1 seconde
- **Simplicite** : Interface minimaliste, mobile-first
- **Independance** : Fonctionne sans Pinchflat
