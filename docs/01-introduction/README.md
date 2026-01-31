# Introduction

## Contexte

SuperTube est une application autonome permettant de telecharger et gerer des videos YouTube. Elle peut s'integrer avec un webhook (ex: Raccourcis iPhone) ou fonctionner de maniere independante. Les videos sont stockees a plat avec le format `Uploader - Titre [ID].mp4` dans un dossier configurable par l'utilisateur.

## Objectif

Creer une interface web ultra-legere permettant de :

- Consulter les videos telechargees
- Lancer de nouveaux telechargements
- Gerer les parametres de telechargement
- Supprimer des videos

## Contraintes

| Contrainte | Specification |
|------------|---------------|
| **Legerete** | Empreinte memoire < 50 Mo |
| **Rapidite** | Temps de chargement < 1 seconde |
| **Simplicite** | Interface minimaliste, mobile-first |
| **Independance** | Application standalone, aucune dependance externe |

---

[Retour au sommaire](../README.md) | [Suivant : Architecture](../02-architecture/)
