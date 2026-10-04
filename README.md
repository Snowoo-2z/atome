# ATOME — déploiement Render

Le site est prêt à être déployé en **Web Service Render**, sans Blueprint et sans fichier `render.yaml`.

## Configuration dans Render

1. Dans Render, choisissez **New → Web Service**.
2. Connectez ce dépôt GitHub, puis sélectionnez la branche qui contient le site.
3. Renseignez les champs suivants :

| Champ Render | Valeur |
| --- | --- |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

4. Cliquez sur **Create Web Service**.

Render fournit automatiquement la variable `PORT`. Le serveur écoute sur cette valeur et sur `0.0.0.0`, ce qui est requis par Render.

## Keep-alive automatique

Le serveur contient un ping automatique toutes les **10 minutes** vers `/health`.

- Sur Render, il utilise automatiquement la variable native `RENDER_EXTERNAL_URL`.
- Aucune variable d’environnement supplémentaire n’est nécessaire.
- Pour forcer une autre URL (par exemple un domaine personnalisé), ajoutez facultativement `SELF_PING_URL` dans l’onglet **Environment** de Render.

> Un ping interne fonctionne tant que l’instance est active. Si votre offre Render suspend complètement le service, un minuteur interne ne peut pas le redémarrer. Pour une disponibilité continue sur une offre avec mise en veille, configurez aussi un moniteur externe (UptimeRobot, Better Uptime ou cron-job.org) vers `https://votre-service.onrender.com/health`, toutes les 10 minutes.

## Localement

```bash
npm run dev
```

Le site sera disponible sur `http://localhost:4173`.
