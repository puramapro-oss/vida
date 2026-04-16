---
name: design-system
description: Design System VIDA (wellness/nature) — emerald #10B981 + sage + Syne
---

# Design VIDA

Domaine : **wellness / nature / éveil**. Référence : Calm, Headspace, Apple Health.

## Couleurs
- Primary : `#10B981` (emerald)
- Secondary : `#84CC16` (sage/lime)
- Background : `#0A0A0F`
- Accent soft : `#059669` (forest)
- Aurora : gradient `emerald → sage → emerald` animé 15s

## Typographie
- Display : `Syne` (titres, hero)
- Body : `Inter` (système)
- Mono : `JetBrains Mono` (chiffres wallet)

## Variante CSS (wellness)
```css
.wellness { --color-accent: #10B981; --color-secondary: #84CC16; }
.wellness .glass-card { @apply rounded-3xl p-6 border-white/[0.08] backdrop-blur-xl; }
.wellness h1 { font-family: 'Syne', sans-serif; @apply text-4xl font-bold tracking-tight; }
.wellness .breathe-slow { animation: breathe 4s ease-in-out infinite; }
@keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
```

## Composants obligatoires
- Sidebar desktop 280 px — navigation principale
- Bottom tab mobile — 5 onglets max (Accueil, Missions, Chat, Impact, Profil)
- Glass cards : `bg-white/[0.04] backdrop-blur-xl border-white/[0.08] rounded-3xl`
- Animations spring(300,30), fade-up stagger, micro-interactions 60fps
- Safe areas iOS + `pb-20 lg:pb-0`

## Interdictions
- 0 Inter générique seul (toujours Syne pour H1/H2)
- 0 gradient violet/pink générique (wellness = emerald+sage)
- 0 image Pollinations dans l'app (icônes Lucide only)
- 0 landing 13 sections (dashboard direct comme ChatGPT)

## Score design
Avant commit, auto-question :
1. « Ressemble à Calm/Headspace/Apple Health ? » → sinon REFAIRE
2. « AI slop ? » → sinon REFAIRE
3. Score mental /10 < 7 → REFAIRE
