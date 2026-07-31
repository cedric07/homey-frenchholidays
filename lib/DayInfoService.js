'use strict';

const CacheService = require('./CacheService');
const HolidayService = require('./HolidayService');
const SchoolHolidayService = require('./SchoolHolidayService');
const MoonService = require('./MoonService');
const SeasonService = require('./SeasonService');
const GeoZoneService = require('./GeoZoneService');
const { translateLabel } = require('./labelTranslations');
const { DEFAULT_SETTINGS } = require('./constants');
const {
  isWeekend,
  dayOfYear,
  weekdayOccurrenceInMonth,
  isLastWeekdayOccurrenceInMonth,
  toParisDateString,
} = require('./dateUtils');

class DayInfoService {

  constructor(homey, log, error) {
    this.homey = homey;
    this.settings = homey.settings;
    this.log = log;
    this.error = error;

    this.cache = new CacheService(this.settings);
    this.holidayService = new HolidayService(this.cache, log, error);
    this.schoolHolidayService = new SchoolHolidayService(this.cache, log, error);
    this.moonService = new MoonService();
    this.seasonService = new SeasonService();
    this.geoZoneService = new GeoZoneService(homey, log, error);

    this._snapshot = null;
    this._previousSnapshot = null;
  }

  _getSettings() {
    return {
      schoolZone: this.settings.get('schoolZone') || DEFAULT_SETTINGS.schoolZone,
      holidayRegion: this.settings.get('holidayRegion') || DEFAULT_SETTINGS.holidayRegion,
      labelLanguage: this.settings.get('labelLanguage') || DEFAULT_SETTINGS.labelLanguage,
    };
  }

  _translateSnapshotLabels(snapshot, lang) {
    if (lang !== 'en' || !snapshot) return snapshot;

    const translated = JSON.parse(JSON.stringify(snapshot));
    if (translated.publicHoliday.label) {
      translated.publicHoliday.label = translateLabel(translated.publicHoliday.label, lang);
    }
    if (translated.publicHoliday.nextLabel) {
      translated.publicHoliday.nextLabel = translateLabel(translated.publicHoliday.nextLabel, lang);
    }
    if (translated.publicHoliday.tomorrowLabel) {
      translated.publicHoliday.tomorrowLabel = translateLabel(translated.publicHoliday.tomorrowLabel, lang);
    }
    if (translated.schoolHoliday.currentLabel) {
      translated.schoolHoliday.currentLabel = translateLabel(translated.schoolHoliday.currentLabel, lang);
    }
    if (translated.schoolHoliday.nextLabel) {
      translated.schoolHoliday.nextLabel = translateLabel(translated.schoolHoliday.nextLabel, lang);
    }
    return translated;
  }

  async refreshCache({ force = false } = {}) {
    const { schoolZone, holidayRegion } = this._getSettings();
    await Promise.all([
      this.holidayService.getHolidaysForRegion(holidayRegion, { force }),
      this.schoolHolidayService.getEvents(schoolZone, { force }),
    ]);
    this.settings.set('lastSyncAt', new Date().toISOString());
    this.log('[DayInfoService] Cache refreshed');
  }

  async compute(date = new Date()) {
    const config = this._getSettings();
    const lang = config.labelLanguage === 'en' ? 'en' : 'fr';

    const [publicHoliday, schoolHoliday, moon, seasonInfo] = await Promise.all([
      this.holidayService.getHolidayInfo(config.holidayRegion, date),
      this.schoolHolidayService.getHolidayInfo(config.schoolZone, date),
      Promise.resolve(this.moonService.getInfo(date, lang)),
      Promise.resolve(this.seasonService.getNextSeasonInfo(date)),
    ]);

    const season = seasonInfo.current;
    const snapshot = {
      date: toParisDateString(date),
      publicHoliday,
      schoolHoliday,
      moon,
      season: {
        id: season,
        name: this.seasonService.getSeasonName(season, lang),
        nextId: seasonInfo.next,
        nextName: this.seasonService.getSeasonName(seasonInfo.next, lang),
        daysUntilNext: seasonInfo.daysUntilNext,
      },
      various: {
        isWeekend: isWeekend(date),
        dayOfYear: dayOfYear(date),
        weekdayOccurrence: weekdayOccurrenceInMonth(date),
        isLastWeekdayOccurrence: isLastWeekdayOccurrenceInMonth(date),
      },
      settings: config,
    };

    return this._translateSnapshotLabels(snapshot, lang);
  }

  async update(date = new Date()) {
    this._previousSnapshot = this._snapshot;
    this._snapshot = await this.compute(date);
    return this._snapshot;
  }

  getSnapshot() {
    return this._snapshot;
  }

  getPreviousSnapshot() {
    return this._previousSnapshot;
  }

  async getSummary() {
    const today = toParisDateString();
    if (!this._snapshot || this._snapshot.date !== today) {
      await this.update();
    }
    return this._snapshot;
  }

  _getTriggeredStore() {
    return this.settings.get('triggeredEvents') || {};
  }

  _triggerStoreKey(triggerId, date) {
    return `${triggerId}:${date}`;
  }

  _wasTriggeredToday(triggerId, date) {
    return this._getTriggeredStore()[this._triggerStoreKey(triggerId, date)] === true;
  }

  markTriggered(triggerId, date) {
    const store = this._getTriggeredStore();
    store[this._triggerStoreKey(triggerId, date)] = true;

    const cutoff = this._dateDaysAgo(date, 14);
    for (const key of Object.keys(store)) {
      const keyDate = key.slice(key.lastIndexOf(':') + 1);
      if (keyDate < cutoff) delete store[key];
    }

    this.settings.set('triggeredEvents', store);
  }

  _dateDaysAgo(isoDate, days) {
    const { year, month, day } = {
      year: parseInt(isoDate.slice(0, 4), 10),
      month: parseInt(isoDate.slice(5, 7), 10),
      day: parseInt(isoDate.slice(8, 10), 10),
    };
    const d = new Date(Date.UTC(year, month - 1, day - days));
    return d.toISOString().slice(0, 10);
  }

  detectChanges() {
    const prev = this._previousSnapshot;
    const curr = this._snapshot;
    if (!curr) return [];

    const changes = [];
    const today = curr.date;

    const add = (type) => {
      if (!this._wasTriggeredToday(type, today)) {
        changes.push({ type });
      }
    };

    if (prev) {
      if (!prev.publicHoliday.isHoliday && curr.publicHoliday.isHoliday) {
        add('public_holiday_today');
      }
      if (!prev.publicHoliday.isHolidayTomorrow && curr.publicHoliday.isHolidayTomorrow) {
        add('public_holiday_tomorrow');
      }
      if (!prev.schoolHoliday.isActive && curr.schoolHoliday.isActive) {
        add('school_holiday_starts');
      } else if (curr.schoolHoliday.startsToday) {
        add('school_holiday_starts');
      }
      if (prev.schoolHoliday.isActive && !curr.schoolHoliday.isActive) {
        add('school_holiday_ends');
      } else if (curr.schoolHoliday.endedToday) {
        add('school_holiday_ends');
      }
      if (!prev.various.isWeekend && curr.various.isWeekend) {
        add('weekend_starts');
      }
      if (prev.season.id !== curr.season.id) {
        add('season_changes');
      }
    } else {
      // No previous snapshot (app restart): fire triggers for today's active states, once per day via markTriggered.
      if (curr.publicHoliday.isHoliday) add('public_holiday_today');
      if (curr.publicHoliday.isHolidayTomorrow) add('public_holiday_tomorrow');
      if (curr.schoolHoliday.isActive || curr.schoolHoliday.startsToday) {
        add('school_holiday_starts');
      }
      if (curr.schoolHoliday.endedToday) add('school_holiday_ends');
      if (curr.various.isWeekend) add('weekend_starts');
    }

    return changes;
  }

  buildFlowTokens(snapshot = this._snapshot) {
    if (!snapshot) return {};
    return {
      public_holiday_label: snapshot.publicHoliday.label || '',
      school_holiday_label: snapshot.schoolHoliday.currentLabel
        || snapshot.schoolHoliday.nextLabel || '',
      days_until_public_holiday: snapshot.publicHoliday.daysUntilNext ?? 0,
      days_until_school_holiday: snapshot.schoolHoliday.daysUntilNext ?? 0,
      days_until_school_holiday_end: snapshot.schoolHoliday.daysUntilEnd ?? 0,
      moon_phase: snapshot.moon.phase,
      moon_phase_name: snapshot.moon.name,
      moon_age: snapshot.moon.age,
      moon_illumination: snapshot.moon.illumination,
      moon_distance: snapshot.moon.distance,
      season_name: snapshot.season.name,
      day_of_year: snapshot.various.dayOfYear,
      weekday_occurrence: snapshot.various.weekdayOccurrence,
      is_last_weekday_occurrence: snapshot.various.isLastWeekdayOccurrence ? 1 : 0,
    };
  }

}

module.exports = DayInfoService;
