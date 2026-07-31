Day Info brings French calendar information into Homey Flows and Dashboards.

Features:
- Public holidays (official calendrier.api.gouv.fr data, 13 regions)
- School vacations (Zone A/B/C, Corsica, overseas territories)
- Moon phase, season, weekend, day of year

Configuration:
Open Apps → Day Info → Settings to choose your school vacation zone and public holiday region.
Use "Suggest from Homey location" to pre-fill both based on your Homey's position (hint only — the zone depends on the school academy).

Data and synchronization:
Public holidays and school vacations are fetched from official French government APIs (calendrier.api.gouv.fr and data.education.gouv.fr) and cached on your Homey. Moon phase, season and weekend are computed locally with no network access.

The cache is refreshed automatically when needed: school vacations at most every 90 days, public holidays at most every 180 days. While the cache is valid, the app works offline using stored data.

Every night (around 00:05 Paris time), the app recalculates "are we on vacation today?", "is tomorrow a public holiday?", etc. from that cache, and triggers your Flows when something changes: school vacation start/end, public holiday today/tomorrow, weekend start, season change.

The "Force sync" button in Settings re-downloads remote calendars immediately, even if the cache has not expired (useful after changing zone or region).

Flow cards:
- Conditions: public holiday, school vacation, weekend, season, moon phase, days until next holiday, weekday occurrence in month (1st–5th), last weekday occurrence in month, day of year
- Triggers: vacation start/end, public holiday today/tomorrow, weekend start, season change

Dashboard widget "Day summary" shows today's key information at a glance.
