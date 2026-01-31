# Webhook (Raccourcis iPhone)

Configuration du webhook pour declencher des telechargements depuis les Raccourcis iOS.

## Principe

```
iPhone Raccourci → HTTP POST → Webhook → SuperTube API → Telechargement
```

## Configuration webhook

Fichier `webhook/hooks.json` :

```json
[
  {
    "id": "download",
    "execute-command": "/scripts/download.sh",
    "command-working-directory": "/scripts",
    "pass-arguments-to-command": [
      { "source": "payload", "name": "url" }
    ],
    "trigger-rule": {
      "match": {
        "type": "value",
        "value": "votre-token-secret",
        "parameter": { "source": "header", "name": "X-Webhook-Token" }
      }
    }
  }
]
```

Fichier `webhook/scripts/download.sh` :

```bash
#!/bin/sh
URL="$1"
curl -X POST "http://supertube:80/api/downloads" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$URL\"}"
```

## Raccourci iOS

1. Ouvrir l'app **Raccourcis**
2. Creer un nouveau raccourci
3. Ajouter action **Obtenir le contenu de l'URL**
   - URL : `http://VOTRE_IP:9001/hooks/download`
   - Methode : POST
   - Corps : JSON `{"url": "[URL de la video]"}`
   - En-tetes : `X-Webhook-Token: votre-token-secret`
4. Ajouter au menu de partage

## Securite

- Toujours utiliser un token secret dans `X-Webhook-Token`
- Ne jamais exposer le webhook sur Internet sans VPN/Tailscale

---

[Retour au Deploiement](./README.md)
