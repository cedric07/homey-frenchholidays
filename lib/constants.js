'use strict';

const SCHOOL_ZONES = [
  { id: 'Zone A', labelFr: 'Zone A', labelEn: 'Zone A' },
  { id: 'Zone B', labelFr: 'Zone B', labelEn: 'Zone B' },
  { id: 'Zone C', labelFr: 'Zone C', labelEn: 'Zone C' },
  { id: 'Corse', labelFr: 'Corse', labelEn: 'Corsica' },
  { id: 'Guadeloupe', labelFr: 'Guadeloupe', labelEn: 'Guadeloupe' },
  { id: 'Martinique', labelFr: 'Martinique', labelEn: 'Martinique' },
  { id: 'Guyane', labelFr: 'Guyane', labelEn: 'French Guiana' },
  { id: 'La Réunion', labelFr: 'La Réunion', labelEn: 'Réunion' },
  { id: 'Mayotte', labelFr: 'Mayotte', labelEn: 'Mayotte' },
  { id: 'Nouvelle-Calédonie', labelFr: 'Nouvelle-Calédonie', labelEn: 'New Caledonia' },
  { id: 'Polynésie française', labelFr: 'Polynésie française', labelEn: 'French Polynesia' },
];

const HOLIDAY_REGIONS = [
  { id: 'metropole', labelFr: 'Métropole', labelEn: 'Metropolitan France' },
  { id: 'alsace-moselle', labelFr: 'Alsace-Moselle', labelEn: 'Alsace-Moselle' },
  { id: 'guadeloupe', labelFr: 'Guadeloupe', labelEn: 'Guadeloupe' },
  { id: 'guyane', labelFr: 'Guyane', labelEn: 'French Guiana' },
  { id: 'la-reunion', labelFr: 'La Réunion', labelEn: 'Réunion' },
  { id: 'martinique', labelFr: 'Martinique', labelEn: 'Martinique' },
  { id: 'mayotte', labelFr: 'Mayotte', labelEn: 'Mayotte' },
  { id: 'nouvelle-caledonie', labelFr: 'Nouvelle-Calédonie', labelEn: 'New Caledonia' },
  { id: 'polynesie-francaise', labelFr: 'Polynésie française', labelEn: 'French Polynesia' },
  { id: 'saint-barthelemy', labelFr: 'Saint-Barthélemy', labelEn: 'Saint Barthélemy' },
  { id: 'saint-martin', labelFr: 'Saint-Martin', labelEn: 'Saint Martin' },
  { id: 'saint-pierre-et-miquelon', labelFr: 'Saint-Pierre-et-Miquelon', labelEn: 'Saint Pierre and Miquelon' },
  { id: 'wallis-et-futuna', labelFr: 'Wallis-et-Futuna', labelEn: 'Wallis and Futuna' },
];

const SEASONS = ['winter', 'spring', 'summer', 'fall'];

const MOON_PHASES = [
  { id: 'new', min: 0, max: 0.0625 },
  { id: 'waxing_crescent', min: 0.0625, max: 0.1875 },
  { id: 'first_quarter', min: 0.1875, max: 0.3125 },
  { id: 'waxing_gibbous', min: 0.3125, max: 0.4375 },
  { id: 'full', min: 0.4375, max: 0.5625 },
  { id: 'waning_gibbous', min: 0.5625, max: 0.6875 },
  { id: 'last_quarter', min: 0.6875, max: 0.8125 },
  { id: 'waning_crescent', min: 0.8125, max: 1 },
];

const DEFAULT_SETTINGS = {
  schoolZone: 'Zone A',
  holidayRegion: 'metropole',
  labelLanguage: 'fr',
};

const CACHE_TTL = {
  holidays: 180 * 24 * 60 * 60 * 1000,
  schoolHolidays: 90 * 24 * 60 * 60 * 1000,
};

const TIMEZONE = 'Europe/Paris';

module.exports = {
  SCHOOL_ZONES,
  HOLIDAY_REGIONS,
  SEASONS,
  MOON_PHASES,
  DEFAULT_SETTINGS,
  CACHE_TTL,
  TIMEZONE,
};
