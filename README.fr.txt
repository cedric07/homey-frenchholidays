Vacances scolaires en France apporte les vacances scolaires (et les jours fériés régionaux) dans vos Flows et Dashboards Homey.

Fonctionnalités :
- Vacances scolaires par zone (A/B/C, Corse, DOM-TOM) via les données officielles de l'Éducation nationale
- Jours fériés régionaux (calendrier.api.gouv.fr, 13 régions) en complément

Configuration :
À l'installation, la zone de vacances et la région des jours fériés sont préremplies depuis la position Homey lorsque c'est possible (sinon Zone A / Métropole).
Vérifiez dans Apps → Vacances scolaires en France → Réglages, et utilisez « Suggérer depuis la position Homey » pour recalculer (la zone dépend de l'académie scolaire).

Données et synchronisation :
Les vacances scolaires et jours fériés sont téléchargés depuis les APIs officielles du gouvernement français (data.education.gouv.fr et calendrier.api.gouv.fr), puis mis en cache sur votre Homey.

Le cache est renouvelé automatiquement lorsque nécessaire : vacances scolaires au plus tard tous les 90 jours, jours fériés au plus tard tous les 180 jours. Tant que le cache est valide, l'app travaille hors ligne avec les données déjà stockées.

Chaque nuit (vers 00h05 heure de Paris), l'app recalcule « est-ce vacances aujourd'hui ? », « férié demain ? », etc. à partir de ce cache, et peut déclencher vos Flows si un événement change.

Le bouton « Forcer la synchronisation » dans les réglages retélécharge immédiatement les calendriers distants, même si le cache n'a pas expiré (utile après un changement de zone ou région).

Langues : l'interface Homey est disponible en français et en anglais. Les libellés calendrier restent en français officiel par défaut ; un réglage optionnel les traduit en anglais.
