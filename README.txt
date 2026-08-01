French School Holidays brings French school vacations (and regional public holidays) into Homey Flows and Dashboards.

Features:
- School vacations by zone (A/B/C, Corsica, overseas territories) from official education data
- Regional public holidays (calendrier.api.gouv.fr, 13 regions) as a complement

Configuration:
On install, the school vacation zone and public holiday region are pre-filled from Homey's location when possible (otherwise Zone A / Metropolitan France).
Check Apps → French School Holidays → Settings, and use "Suggest from Homey location" to recalculate (the zone depends on the school academy).

Data and synchronization:
School vacations and public holidays are fetched from official French government APIs (data.education.gouv.fr and calendrier.api.gouv.fr) and cached on your Homey.

The cache is refreshed automatically when needed: school vacations at most every 90 days, public holidays at most every 180 days. While the cache is valid, the app works offline using stored data.

Every night (around 00:05 Paris time), the app recalculates "are we on vacation today?", "is tomorrow a public holiday?", etc. from that cache, and can trigger your Flows when something changes.

The "Force sync" button in Settings re-downloads remote calendars immediately, even if the cache has not expired (useful after changing zone or region).

Languages: Homey UI is available in French and English. Calendar event names default to official French; an optional setting translates them to English.
