# Revue de FOCUSROLL (projet initial généré avec Gemini)

Méthode : lecture complète du code (~2 300 lignes) + parcours utilisateur réel dans Chromium (mobile 390×844) sur le build de production.
✅ = corrigé dans cette passe.

## Bugs bloquants / graves
| # | Problème | Constat |
|---|---|---|
| 1 | ✅ **Service worker cache-first** : `index.html` figé pour toujours, bundles JS/CSS jamais précachés | Après un déploiement l'app pointe vers des bundles supprimés (écran vide) ; hors-ligne ne marchait pas malgré ce que disait le README |
| 2 | ✅ **Minuteur `setInterval` décrémental** | Dérive/gèle dès que l'onglet est en arrière-plan ou l'écran verrouillé : le cas d'usage n°1 d'un timer de focus |
| 3 | ✅ **Recharger pendant un focus perdait la session** sans trace | Aucune persistance de la session en cours |
| 4 | ✅ Effets de bord (son, confettis) dans un updater `setState` | Doublons en StrictMode, fragile |
| 5 | ✅ `BulkError` non géré au démarrage | Race `initializeDatabase` (StrictMode / appels concurrents) |
| 6 | ✅ Mode « plage » : `undefined-undefined min` | Valeurs affichées (20/45) mais jamais enregistrées |

## Logique produit
- ✅ Une session de **1 seconde** validée par « ✓ » comptait comme terminée → série de jours truquée, « 2 sessions · 0 min ». Maintenant : ✓ après 1 min, abandon <30 s non enregistré, sessions passées/abandonnées non comptées comme « faites ».
- ✅ « Relancer » / « Passer » pouvaient retomber sur la même activité ; la raison du skip n'était pas utilisée alors que l'UI promettait d'« affiner la roulette » (texte corrigé, raison visible dans le journal).
- ✅ Mode **Balanced** : pondération par activité × bonus catégorie → une catégorie à 3 activités sortait 3× plus. Maintenant catégorie d'abord, puis activité.
- ✅ La roulette tournait sur les activités **inactives** et « téléportait » sur la cible au dernier pas ; l'effet redémarrait à chaque rendu parent.
- ✅ La durée choisie (preset) restait collée aux relances suivantes.
- ✅ « Dernière session » affichait un ✓ vert même pour un abandon.
- ✅ Notification « fin de timer » envoyée seulement après clic sur DONE (donc inutile) ; `new Notification` échoue sur Android → `registration.showNotification`.
- ✅ Streak : calcul par soustraction de 24 h (faux au changement d'heure), record calculé mais jamais affiché.

## UX / mobile
- ✅ Champs numériques impossibles à vider (`|| 25` à chaque frappe), suppression d'activité sans confirmation, actions destructrices (abandon) sans confirmation.
- ✅ iOS PWA : contenu sous l'encoche (pas de `safe-area`), `100vh`, `user-select:none` bloquant la saisie, viewport `user-scalable=no`.
- ✅ Interface mi-anglais / mi-français unifiée en français (noms de fonctions Roll / Focus / No Choice conservés).
- ✅ Cibles tactiles trop petites, labels ARIA absents (switchs, radios, dialogues).
- ✅ Aucun état vide si toutes les activités sont désactivées (le bouton ne faisait rien).
- ✅ `beforeinstallprompt` capté trop tard (au montage des Réglages) → installation 1-clic jamais proposée.

## Ajouts (utilisateur qui veut progresser)
Objectif quotidien + progression, graphique 7 jours, équilibre par catégorie, record de série, message bienveillant quand la série est à 0, suppression d'une session erronée, vibration, écran maintenu allumé, export/import JSON, raccourci PWA `?action=roll` réellement géré, `storage.persist()`.

## Qualité
Tests unitaires (moteur, stats, minuteur : 31 tests), CI GitHub Actions, dépendances inutilisées retirées (`clsx`, `tailwind-merge`, `postcss`, `autoprefixer`), fichiers de scaffold Vite supprimés, avertissements oxlint résolus.

## Limites connues / pistes
- Une web app ne peut pas sonner écran verrouillé + JS suspendu (pas de push serveur) : documenté dans le README.
- Catégories non personnalisables (5 fixes) ; pas de rappel planifié ; bundle ~160 kB gzip dominé par framer-motion.
- Pas de tests de composants / E2E automatisés dans le repo (le parcours a été joué avec Playwright hors repo).
