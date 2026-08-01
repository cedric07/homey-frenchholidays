Vacances scolaires en France apporte les vacances scolaires (et les jours fériés régionaux) dans vos Flows et Dashboards Homey.

Fonctionnalités :
- Vacances scolaires par zone (A/B/C, Corse, DOM-TOM) via les données officielles de l'Éducation nationale
- Jours fériés régionaux (calendrier.api.gouv.fr, 13 régions) en complément

Configuration :
Allez dans Apps → Vacances scolaires en France → Réglages pour choisir votre zone de vacances scolaires et votre région de jours fériés.
Utilisez « Suggérer depuis la position Homey » pour pré-remplir les deux champs selon la géolocalisation de votre box (simple aide, la zone dépend de l'académie scolaire).

Données et synchronisation :
Les vacances scolaires et jours fériés sont téléchargés depuis les APIs officielles du gouvernement français (data.education.gouv.fr et calendrier.api.gouv.fr), puis mis en cache sur votre Homey.

Le cache est renouvelé automatiquement lorsque nécessaire : vacances scolaires au plus tard tous les 90 jours, jours fériés au plus tard tous les 180 jours. Tant que le cache est valide, l'app travaille hors ligne avec les données déjà stockées.

Chaque nuit (vers 00h05 heure de Paris), l'app recalcule « est-ce vacances aujourd'hui ? », « férié demain ? », etc. à partir de ce cache, et déclenche vos Flows si un événement change : début ou fin de vacances scolaires, jour férié aujourd'hui ou demain, ou compte à rebours (début/fin dans N jours).

Le bouton « Forcer la synchronisation » dans les réglages retélécharge immédiatement les calendriers distants, même si le cache n'a pas expiré (utile après un changement de zone ou région).

Cartes Flow :
- Conditions : vacances / férié (aujourd'hui, demain, hier), type de vacances, prochaines vacances/férié dans N jours ou moins, fin des vacances dans N jours ou moins
- Déclencheurs : début/fin des vacances, férié aujourd'hui/demain, vacances commencent/se terminent dans N jours

Le widget Dashboard « Aujourd'hui » affiche l'essentiel en un coup d'œil.

Langues : l'interface Homey est disponible en français et en anglais. Les libellés calendrier restent en français officiel par défaut ; un réglage optionnel les traduit en anglais.
