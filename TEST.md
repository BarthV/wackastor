# Wackastor -- Guide de dev local

## 1. Prerequis

- Node.js 20+
- pnpm
- Une application Discord (type Bot) sur https://discord.com/developers/applications

## 2. Creer l'application Discord

1. https://discord.com/developers/applications > **New Application**
2. Onglet **OAuth2** :
   - Copier **Client ID** et **Client Secret**
   - Ajouter le redirect : `http://localhost:5173/auth/discord/callback`
3. Onglet **Bot** : activer le bot (necessaire pour le scope `guilds.members.read`)
4. Inviter le bot sur ton serveur Discord de test :
   ```
   https://discord.com/oauth2/authorize?client_id=TON_CLIENT_ID&permissions=0&scope=bot
   ```

## 3. Configuration

```bash
cp .env.example .env
```

Remplir dans `.env` :

| Variable | Requis | Description |
|----------|--------|-------------|
| `DISCORD_CLIENT_ID` | oui | Client ID de l'app Discord |
| `DISCORD_CLIENT_SECRET` | oui | Client Secret |
| `DISCORD_REDIRECT_URI` | oui | `http://localhost:5173/auth/discord/callback` |
| `SUPERADMIN_DISCORD_IDS` | non | Ton Discord User ID (clic droit > Copier l'identifiant) pour avoir le role admin |
| `DATABASE_URL` | non | `file:local.db` par defaut |
| `CRON_SECRET` | non | N'importe quelle valeur pour tester les endpoints de sync |
| `UEXCORP_API_KEY` | non | Bearer token UEXcorp (optionnel, les syncs marchent sans) |

## 4. Lancer

```bash
pnpm install
pnpm drizzle-kit push   # cree local.db avec le schema
pnpm dev                 # http://localhost:5173
```

## 5. Premier login

1. Aller sur http://localhost:5173 → redirection vers `/login`
2. Cliquer **Se connecter avec Discord**
3. Autoriser l'application
4. Le callback cree automatiquement :
   - L'utilisateur en base
   - La corporation (= le serveur Discord du bot)
   - Le membership (avec le role admin si ton ID est dans `SUPERADMIN_DISCORD_IDS`)
5. Redirection vers `/stock`

> **Pas de serveur Discord de test ?** L'app a besoin que le bot soit sur un serveur ET que tu sois membre de ce serveur. Un petit serveur perso suffit.

## 6. Charger les donnees UEXcorp

Depuis l'interface admin (`/admin/sync`) : cliquer **FORCER_SYNCHRONISATION** sur chaque ressource.

Ou via script :

```bash
node scripts/test-sync.mjs
```

## 7. Tester les fonctionnalites

| Page | URL | Ce qu'on peut tester |
|------|-----|---------------------|
| Stock corp | `/stock` | Vue aggregee, filtres, recherche |
| Inventaire | `/inventory` | Ajouter/modifier/supprimer des objets |
| Commandes | `/commandes` | Creer une commande, voir le matching |
| Detail commande | `/commandes/[id]` | Sidebar de correspondances |
| Admin membres | `/admin/members` | Promouvoir/retrograder, supprimer |
| Admin sync | `/admin/sync` | Voir statut sync, forcer resync |
| Admin bindings | `/admin/members` (bas de page) | Lier des roles Discord |

Pour tester le **matching** : creer un objet dans l'inventaire avec un joueur, puis creer une commande pour le meme item avec un autre joueur (necessite 2 comptes Discord ou manipulation directe en base).

## 8. Commandes utiles

```bash
pnpm dev              # Serveur dev
pnpm check            # Verification des types
pnpm vitest run       # Tests unitaires (24 tests)
pnpm build            # Build production
pnpm drizzle-kit push # Appliquer les changements de schema
```

## 9. Structure de la base

SQLite local (`local.db`). Inspecter avec n'importe quel client SQLite :

```bash
sqlite3 local.db ".tables"
# users, sessions, corporations, corp_members, corp_role_bindings
# uex_commodities, uex_item_categories, uex_items, uex_locations, uex_terminals, uex_sync_log
# inventory_items, orders, order_matches
```
