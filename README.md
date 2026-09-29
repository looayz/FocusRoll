# FOCUSROLL — Productivity Randomizer

> **"You don't decide. You focus."**  
> An ultra-minimalist, distraction-free productivity randomizer designed to eliminate decision fatigue by picking and timing what you do next.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-emerald.svg)](https://w3c.github.io/manifest/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)

---

## 🇬🇧 English

### Concept & Philosophy
Modern productivity often suffers from **decision fatigue**: opening task managers, overthinking priorities, and procrastinating instead of taking action.  
FOCUSROLL takes the opposite approach:
- You open the app.
- Hit **ROLL** (or pick directly from your active pool).
- FOCUSROLL selects an activity and an optimal time block.
- Hit **START FOCUS** and enter a distraction-free zen mode.

### Key Features
1. **Interactive Roulette Engine (60 FPS)**:
   - Physics-inspired smooth deceleration curve.
   - Mechanical tick sounds with Web Audio API.
   - **3 Randomization Algorithms**:
     - **Smart Mode**: Anti-repetition penalties & custom user weights (1–5).
     - **Balanced Mode**: Fair distribution across 5 core life categories (*Spirituality, Work & Creation, Intellect & Learning, Body & Health, Leisure*).
     - **Pure Random**: 100% equal chance across all active activities.
   - **No Choice Mode**: Extreme focus toggle. One click immediately rolls and launches focus without any hesitation.
   - **Direct Activity Picker**: Allows picking an activity directly into the focus card if you already have a target in mind.
2. **Zen Focus Mode**:
   - Clean circular SVG countdown ring with live accent colors.
   - Pause, resume, graceful early finish, or skip with structured feedback (*Too tired, wrong mood, urgent interruption*).
   - End-of-session completion feedback (😫 Difficult, 😐 Okay, 🙂 Good, 🔥 Great) and gentle celebratory confetti.
3. **PWA & Mobile-First Installation**:
   - Installable on Android (Chrome/Opera), iOS (Safari Add to Home Screen), and Desktop (Windows / macOS / Chrome standalone window).
   - High-resolution SVG and PNG icons (192x192, 512x512, apple-touch-icon).
   - Generated service worker (Workbox): full precache, real offline support and automatic updates.
4. **Local Data Persistence (No Account Needed)**:
   - 100% private, instant IndexedDB storage powered by **Dexie.js**.
   - No tracking, no mandatory cloud login.
5. **Benevolent Streak & Analytics**:
   - Tracks current & longest focus streaks without guilt or toxic shaming ("Start again" approach).
   - Daily, weekly, monthly, and all-time session history.
6. **Synthesized Web Audio Effects**:
   - Discrete clicks, lock tone, chord chime, and a 528Hz Solfeggio bell for session endings. Fully toggleable.

### Project Structure
```text
FocusRoll/
├── public/
│   ├── icon.svg                 # Vector master app icon
│   ├── pwa-192x192.png          # Android standard launcher icon
│   ├── pwa-512x512.png          # High-res splash & install icon
│   ├── apple-touch-icon.png     # iOS Safari home screen icon
│   ├── manifest.json            # PWA Web App Manifest
│   └── (sw.js généré au build par vite-plugin-pwa)
├── src/
│   ├── components/
│   │   ├── home/                # Home screen, "What's Next", manual picker
│   │   ├── roulette/            # 60fps Decelerating motion roulette
│   │   ├── focus/               # Circular SVG zen timer & feedback modal
│   │   ├── history/             # Journal, stats & non-punitive streaks
│   │   ├── navigation/          # Minimalist thumb-friendly bottom nav
│   │   ├── settings/            # Activity CRUD, weight sliders, engine mode
│   │   └── ui/                  # PWA install prompt & platform guides
│   ├── lib/
│   │   ├── activeSession.ts     # Session en cours persistée (minuteur par horodatage)
│   │   ├── notifications.ts     # Notifications, vibration
│   │   ├── useWakeLock.ts       # Écran allumé pendant le focus
│   │   ├── randomizer/          # Pure, Smart, and Balanced engine logic
│   │   ├── sound.ts             # Web Audio API synthesizer
│   │   ├── statistics/          # Aggregation & streak calculations
│   │   └── storage/             # Dexie.js (IndexedDB) : modèles + export/import JSON
│   ├── types/                   # TypeScript interfaces & domain contracts
│   ├── App.tsx                  # Core state orchestrator
│   ├── index.css                # Deep dark theme styling
│   └── main.tsx                 # React DOM mount point
├── DECISIONS.md                 # Architecture & design rationale
├── PROJECT_STATUS.md            # Current phase & progress status
└── README.md
```

### Getting Started
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Lint & unit tests (engine, stats, timer)
npm run lint
npm test

# Build for production
npm run build
```

### Reliability notes
- The timer is derived from timestamps (not a per-second counter) and the running session is persisted: a reload, a frozen background tab or a phone lock never loses or drifts your session. The screen is kept awake during focus (Wake Lock API).
- A web app cannot ring while the phone is locked and JS is suspended; keep the app in the foreground for the end-of-session bell (notifications fire when the app is merely in the background).
- Everything is stored on the device: use **Settings → Your data → Export** for backups.

---

## 🇫🇷 Français

### Concept & Philosophie
La productivité moderne est souvent ralentie par la **fatigue décisionnelle** : ouvrir des listes interminables, sur-analyser ses priorités et hésiter au lieu d'agir.  
FOCUSROLL inverse la démarche :
- Vous ouvrez l'application.
- Vous appuyez sur **ROLL** (ou vous choisissez directement votre activité).
- FOCUSROLL sélectionne l'activité et le bloc horaire adapté.
- Vous lancez **START FOCUS** et entrez dans un état de concentration zen, sans parasite visuel.

### Fonctionnalités Clés
1. **Moteur de Roulette Fluide (60 FPS)** :
   - Courbe de décélération progressive réaliste.
   - Clavier audio de clics mécaniques via Web Audio API.
   - **3 Algorithmes de Tirage** :
     - **Mode Smart** : Pénalisation des répétitions immédiates et prise en compte des poids personnalisés (1 à 5).
     - **Mode Balanced** : Répartition équitable entre 5 piliers de vie (*Spiritualité, Travail & Création, Intellect & Lecture, Corps & Santé, Loisirs*).
     - **Mode Aléatoire Pur** : Équiprobabilité stricte parmi les activités activées.
   - **Mode "No Choice"** : Focus radical sans hésitation possible. Un simple clic lance directement le timer.
   - **Sélecteur Direct d'Activité** : Possibilité d'assigner immédiatement une tâche ciblée dans la roulette si votre choix est déjà fait.
2. **Mode Focus Zen** :
   - Anneau circulaire SVG avec décompte précis et teintes d'accentuation dédiées.
   - Pause, reprise, complétion anticipée ou abandon/skip avec motif analysable (*Fatigue, manque de temps, interruption*).
   - Bilan émotionnel de fin de session (😫 Difficile, 😐 Moyen, 🙂 Bien, 🔥 Super) et pluie de confettis.
3. **Installation PWA Mobile & Ordinateur** :
   - Installable sur Android (Chrome/Opera), iOS (Safari "Ajouter à l'écran d'accueil") et PC (fenêtre standalone épinglable à la barre des tâches).
   - Icônes vectorielles et PNG haute résolution (192x192, 512x512, apple-touch-icon).
   - Service Worker généré (Workbox) : précache complet, hors-ligne réel et mise à jour automatique.
4. **Données 100% Locales & Privées (Sans Compte)** :
   - Persistance instantanée sur IndexedDB via **Dexie.js**.
   - Aucun compte requis, aucune dépendance cloud externe pour le cœur de l'application.
5. **Série d'Assiduité (Streaks) Bienveillante** :
   - Valorise la régularité sans culpabilisation toxique (philosophie "Start again").
   - Historique complet par filtres : Aujourd'hui, Semaine, Mois, Tout.
6. **Moteur Sonore Synthétisé Intégré** :
   - Clics discrets, tonalités zen et cloche tibétaine 528Hz générés directement par le navigateur.

### Fiabilité
- Le minuteur est calculé à partir d'horodatages (pas d'un compteur à la seconde) et la session en cours est sauvegardée : un rechargement, un onglet gelé en arrière-plan ou un verrouillage du téléphone ne fait ni perdre ni dériver la session. L'écran reste allumé pendant le focus (Wake Lock).
- Une web app ne peut pas sonner quand le téléphone est verrouillé et le JS suspendu : garde l'app au premier plan pour la cloche de fin (la notification, elle, part si l'app est simplement en arrière-plan).
- Tout est stocké sur l'appareil : utilise **Réglages → Tes données → Exporter** pour sauvegarder.
- Objectif quotidien, graphique 7 jours et équilibre par catégorie dans le Journal.

### Commandes Utiles
```bash
npm install     # Installation des paquets
npm run dev     # Serveur local
npm run lint    # Lint
npm test        # Tests unitaires (moteur, stats, minuteur)
npm run build   # Build de production (génère aussi le service worker)
```
