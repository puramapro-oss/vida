---
name: vercel-deploy
description: Déploiement Vercel Purama (team puramapro-oss)
---

# Vercel — Team puramapro-oss

- Team ID : `team_dGuJ4PqnSU1uaAHa26kkmKKk`
- Token : `$VERCEL_TOKEN`
- Domain VIDA : `vida.purama.dev`

## Commandes (token-based, JAMAIS login interactif)

```bash
# Preview
vercel --token $VERCEL_TOKEN --scope puramapro-oss --yes

# Production
vercel --prod --token $VERCEL_TOKEN --scope puramapro-oss --yes

# Ajouter domaine
vercel domains add vida.purama.dev --token $VERCEL_TOKEN --scope puramapro-oss

# Pusher env vars
vercel env add NEXT_PUBLIC_XXX production --token $VERCEL_TOKEN --scope puramapro-oss
```

## Pré-deploy (bloquants)

1. `npm run build` → 0 erreur
2. `qa-agent` VERDICT OK
3. `security-agent` VERDICT OK
4. Env vars présentes sur Vercel (pas juste `.env.local`)
5. Domaine `*.purama.dev` accessible

## Post-deploy

```bash
curl -I https://vida.purama.dev  # attend 200
```
