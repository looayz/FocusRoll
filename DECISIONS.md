# FOCUSROLL — Decisions Architecture

1. **Stack Technique : React 19 + TypeScript + Vite + Tailwind v4 + Framer Motion**
   - Démarrage instantané, support PWA offline natif via Service Worker.
   - Poids plume, réactivité 60 FPS pour les animations de roulette et transitions d'écran.

2. **Stockage Local : Dexie.js (IndexedDB)**
   - Données 100% hors-ligne et locales, aucun compte obligatoire pour le MVP.
   - Tables : `activities`, `categories`, `sessions`, `settings`.

3. **Randomizer Engine : 3 Modes**
   - **Pure Random** : Distribution équiprobable.
   - **Smart** : Prise en compte de la récence (pénalité de répétition) et du poids configuré.
   - **Balanced** : Alternance équilibrée entre les catégories (Spiritualité, Travail, Intellect, Corps, Détente).
   - Mode "I Don't Want To Decide" : Déclenchement direct sans inspection des listes.

4. **Audio & Feedback Haptique**
   - Générateur Web Audio API intégré (sons subtils : clic roulette, cloche tibétaine douce pour fin de session, tonalité de démarrage). Aucune dépendance de fichier mp3 externe qui pourrait échouer hors-ligne.

5. **PWA Standalone & Desktop / Mobile First**
   - Layout vertical élégant centré en widget compact sur desktop (max 480px) et plein écran responsive sur smartphone.
   - Manifest PWA avec icônes SVG haute résolution, orientation portrait, raccourcis et couleurs thème noir absolu `#090a0f`.
