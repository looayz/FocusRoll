# Architecture de FOCUSROLL

Application 100 % front-end (aucun serveur, aucun compte) : **React 19 + TypeScript + Vite**, style **Tailwind v4**, animations **Framer Motion**, données locales **Dexie (IndexedDB)**, installable en **PWA**.

## Vue d'ensemble

```
Navigateur / app installée
┌──────────────────────────────────────────────────────────────┐
│ App.tsx  (chef d'orchestre : état global + actions)          │
│   ├─ HomeView ── Roulette          (tirage, durée, démarrage)│
│   ├─ FocusView                     (minuteur, pause, fin)    │
│   ├─ HistoryView                   (journal, graphiques)     │
│   └─ SettingsView                  (réglages, activités,     │
│                                     permissions, sauvegarde) │
│                                                              │
│ lib/  (logique pure, sans React, testée)                     │
│   randomizer · statistics · activeSession · sound · ...      │
│                                                              │
│ Stockage : IndexedDB (Dexie)  +  localStorage (session live) │
│ Service worker (Workbox) : précache, hors-ligne, mises à jour│
└──────────────────────────────────────────────────────────────┘
        ▲ déployé par GitHub Actions sur GitHub Pages
```

## Arborescence

```
src/
├── main.tsx                 Point d'entrée ; capte l'événement d'installation PWA
├── App.tsx                  État global (activités, sessions, réglages, session en cours)
│                            et toutes les actions (tirer, démarrer, terminer, passer…)
├── types/index.ts           Modèles : Activity, Session, UserSettings, ActiveSession
├── components/
│   ├── home/HomeView.tsx        Écran d'accueil : bouton Roll, choix direct, objectif du jour
│   ├── roulette/Roulette.tsx    Animation de tirage (atterrit exactement sur l'activité tirée)
│   ├── focus/FocusView.tsx      Écran de focus : anneau, pause, abandon, bilan de fin
│   ├── history/HistoryView.tsx  Journal : stats, graphique 7 jours, équilibre, liste par jour
│   ├── settings/SettingsView.tsx Réglages : tirage, objectif, sons, vibration, notifications,
│   │                             activités (CRUD), export/import
│   ├── navigation/Navigation.tsx Barre du bas
│   └── ui/                      ConfirmDialog, NumberInput, InstallPromptModal
└── lib/
    ├── randomizer/engine.ts     Choix de l'activité (modes pure / smart / balanced) et de la durée
    ├── statistics/calculator.ts Séries, totaux, stats par jour et par catégorie
    ├── activeSession.ts         Session en cours (horodatage, pauses) + persistance localStorage
    ├── storage/db.ts            Schéma Dexie + données par défaut + initialisation
    ├── storage/backup.ts        Export / import JSON
    ├── notifications.ts         Permission de notification (état en direct), notifications, vibration
    ├── installPrompt.ts         Capte `beforeinstallprompt` dès le démarrage
    ├── useWakeLock.ts           Garde l'écran allumé pendant un focus
    └── sound.ts                 Sons synthétisés (Web Audio)
public/                      manifest.json, icônes (servis tels quels)
vite.config.ts               Plugins React / Tailwind / PWA (génère le service worker)
.github/workflows/           ci.yml (lint + tests + build) · deploy.yml (GitHub Pages)
```

Les fichiers `*.test.ts` à côté de `engine`, `calculator` et `activeSession` sont les tests unitaires (`npm test`).

## Flux de données

1. **Démarrage** : `App` initialise la base (données par défaut au premier lancement), charge activités / sessions / réglages, et restaure une éventuelle session en cours depuis `localStorage`.
2. **Tirage** : `HomeView` → `App.rollFrom()` → `engine.pickNextActivity()` (selon le mode et l'historique récent) → la `Roulette` anime puis `App` affiche la carte de l'activité et sa durée.
3. **Focus** : `handleStartFocus` crée une `ActiveSession` (`startedAt`, pauses cumulées) sauvegardée dans `localStorage` à chaque changement. `FocusView` n'a pas de compteur : le temps restant est **calculé depuis l'horloge**, donc exact même si l'onglet est gelé ou rechargé.
4. **Fin** : `FocusView` détecte la fin (son, vibration, notification si l'app est en arrière-plan) ; l'utilisateur valide avec son ressenti. `App.recordSession()` écrit une `Session` dans IndexedDB puis recharge les données.
5. **Statistiques** : `computeStats` et consorts sont recalculées à partir des sessions (rien n'est stocké en double).

## Où est stocké quoi
| Donnée | Emplacement |
|---|---|
| Activités, catégories, sessions, réglages | IndexedDB (`focusroll_db`) via Dexie |
| Session en cours (survit au rechargement) | `localStorage` (`focusroll:active-session`) |
| Cache de l'app (hors-ligne) | Cache du service worker (Workbox) |
| Sauvegarde | Fichier JSON exporté par l'utilisateur |

## Permissions : où les changer
L'app ne demande qu'une permission : les **notifications**.
- **Dans l'app** : onglet **Réglages → Notification de fin**. L'état (accordée / refusée / pas encore demandée) est affiché en direct. Si elle est refusée, le navigateur ne redemande pas : l'app affiche le pas-à-pas pour la rétablir dans le système, puis s'active toute seule au retour.
- **Dans le téléphone** : Android → appui long sur l'icône → *Infos sur l'appli* → *Notifications*. iPhone → *Réglages* → *Notifications* → FOCUSROLL.
- **Dans le code** : `src/lib/notifications.ts` (permission, notifications) et le bloc « Notification de fin » de `src/components/settings/SettingsView.tsx`.

## Build et déploiement
- `npm run dev` : serveur local. `npm run build` : build de production + génération du service worker.
- Un push sur `main` déclenche `deploy.yml` : tests, build avec `BASE_PATH=/FocusRoll/`, publication sur GitHub Pages (`https://looayz.github.io/FocusRoll/`).
- `BASE_PATH` permet d'héberger l'app sous un sous-chemin ; le manifest utilise des chemins relatifs pour que l'installation marche partout.

## Choix structurants
Voir `DECISIONS.md` (minuteur par horodatage, service worker Workbox, mode Balanced par catégorie…) et `REVIEW.md` (audit du projet initial).
