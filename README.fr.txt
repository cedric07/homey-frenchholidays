Informations du jour apporte les données du calendrier français dans vos Flows et Dashboards Homey.

Fonctionnalités :
- Jours fériés (données officielles calendrier.api.gouv.fr, 13 régions)
- Vacances scolaires (zones A/B/C, Corse, DOM-TOM)
- Phase lunaire, saison, week-end, jour de l'année

Configuration :
Allez dans Apps → Informations du jour → Réglages pour choisir votre zone de vacances scolaires et votre région de jours fériés.
Utilisez « Suggérer depuis la position Homey » pour pré-remplir les deux champs selon la géolocalisation de votre box (simple aide, la zone dépend de l'académie scolaire).

Données et synchronisation :
Les jours fériés et vacances scolaires sont téléchargés depuis les APIs officielles du gouvernement français (calendrier.api.gouv.fr et data.education.gouv.fr), puis mis en cache sur votre Homey. La lune, la saison et le week-end sont calculés localement, sans appel réseau.

Le cache est renouvelé automatiquement lorsque nécessaire : vacances scolaires au plus tard tous les 90 jours, jours fériés au plus tard tous les 180 jours. Tant que le cache est valide, l'app travaille hors ligne avec les données déjà stockées.

Chaque nuit (vers 00h05 heure de Paris), l'app recalcule « est-ce vacances aujourd'hui ? », « férié demain ? », etc. à partir de ce cache, et déclenche vos Flows si un événement change : début ou fin de vacances scolaires, jour férié aujourd'hui ou demain, début du week-end, changement de saison.

Le bouton « Forcer la synchronisation » dans les réglages retélécharge immédiatement les calendriers distants, même si le cache n'a pas expiré (utile après un changement de zone ou région).

Cartes Flow :
- Conditions : jour férié, vacances scolaires, week-end, saison, phase lunaire, jours avant prochaines vacances/férié, occurrence du jour dans le mois (1ère à 5ème), dernière occurrence du jour dans le mois, jour de l'année
- Déclencheurs : début/fin des vacances, férié aujourd'hui/demain, début du week-end, changement de saison

Le widget Dashboard « Résumé du jour » affiche l'essentiel en un coup d'œil.
