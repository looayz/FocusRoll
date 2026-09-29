# FOCUSROLL — Status & Roadmap

## Statut : Phase 1, Phase 2, Phase 3 & PWA Complétées

- [x] Initialisation environnement (Vite, React 19, TypeScript, Tailwind v4, Framer Motion, Dexie)
- [x] Système de base de données IndexedDB avec données par défaut (Coran, Coder, Échecs, Lecture, Sport, Révisions)
- [x] PWA Manifest (`manifest.json`), Icône vectorielle haute fidélité (`icon.svg`), Service Worker offline (`sw.js`)
- [x] Moteur de Randomisation (3 Modes : Pure Random, Smart avec pénalité de répétition/poids, Balanced équilibrant les catégories)
- [x] Mode "No Choice" : zéro hésitation, direct au focus
- [x] Écran HOME avec roulette animée fluide 60fps & sélecteur de durée (Fixe, Plage, Presets 15/25/30/45/60 min)
- [x] Écran FOCUS avec timer zen, anneau SVG dynamique circulaire, pause, skip avec recueil de motif, complétion avec feedback émotionnel (😫 😐 🙂 🔥)
- [x] Écran HISTORY & PROGRESS avec filtrage (Aujourd'hui, Semaine, Mois, Tout) & calcul de streaks bienveillants ("Start again", pas de culpabilité)
- [x] Écran SETTINGS / ACTIVITIES (création, modification, suppression, toggle actif/inactif, catégories, sons Web Audio API, notifications PWA)
- [x] Audio synthétisé discret (clic roulette, tonalité démarrage, cloche tibétaine 528Hz fin de session)
- [x] Build de production validé sans erreur TypeScript

## Passe de revue & fiabilisation

- [x] Minuteur par horodatage + session persistée (reprise après rechargement), Wake Lock, notification/vibration à la fin
- [x] Service worker Workbox (l'ancien `sw.js` cache-first cassait l'app après un déploiement et ne fonctionnait pas hors-ligne)
- [x] Moteur : exclusion de l'activité passée/relancée, Balanced réellement équilibré par catégorie, tests unitaires
- [x] Stats : jours locaux (heure d'été), série record affichée, sessions "passées/abandonnées" plus comptées comme faites
- [x] Objectif quotidien, graphique 7 jours, équilibre par catégorie, suppression de session
- [x] Export / import JSON des données
- [x] Formulaire d'activité corrigé (plage, champs numériques, confirmations de suppression)
- [x] Safe areas iOS, `dvh`, saisie iOS, accessibilité de base
- [ ] Idées suivantes : catégories personnalisables, rappels/planification, notes de session, i18n EN
