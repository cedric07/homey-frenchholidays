'use strict';

const { CACHE_TTL } = require('./constants');
const { toParisDateString } = require('./dateUtils');
const { shiftParisDateString } = require('./calendarMatchers');

const HOLIDAY_API_BASE = 'https://calendrier.api.gouv.fr/jours-feries';

class HolidayService {

  constructor(cache, log, error) {
    this.cache = cache;
    this.log = log;
    this.error = error;
  }

  async _fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Holiday API error ${response.status}: ${url}`);
    }
    return response.json();
  }

  async _loadRegionYear(region, year, force = false) {
    const cacheKey = `${region}:${year}`;
    if (force) {
      this.cache.invalidate('holidays', cacheKey);
    }
    const cached = this.cache.getValid('holidays', cacheKey);
    if (cached) return cached;

    try {
      const data = await this._fetchJson(`${HOLIDAY_API_BASE}/${region}/${year}.json`);
      this.cache.set('holidays', cacheKey, data, CACHE_TTL.holidays);
      return data;
    } catch (err) {
      this.error('[HolidayService] fetch failed:', err.message);
      const stale = this.cache.getStale('holidays', cacheKey);
      if (stale) return stale;
      throw err;
    }
  }

  async getHolidaysForRegion(region, { force = false } = {}) {
    const year = new Date().getFullYear();
    const years = [year - 1, year, year + 1];
    const merged = {};

    for (const y of years) {
      const data = await this._loadRegionYear(region, y, force);
      Object.assign(merged, data);
    }

    return merged;
  }

  async getHolidayInfo(region, date = new Date()) {
    const holidays = await this.getHolidaysForRegion(region);
    const today = toParisDateString(date);
    const yesterday = shiftParisDateString(today, -1);
    const tomorrow = shiftParisDateString(today, 1);

    const isHoliday = Object.prototype.hasOwnProperty.call(holidays, today);
    const label = isHoliday ? holidays[today] : null;
    const isHolidayYesterday = Object.prototype.hasOwnProperty.call(holidays, yesterday);
    const isHolidayTomorrow = Object.prototype.hasOwnProperty.call(holidays, tomorrow);

    let nextDate = null;
    let nextLabel = null;
    const sortedDates = Object.keys(holidays).sort();

    for (const d of sortedDates) {
      if (d > today) {
        nextDate = d;
        nextLabel = holidays[d];
        break;
      }
    }

    const daysUntilNext = nextDate
      ? Math.round((new Date(`${nextDate}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86400000)
      : null;

    return {
      isHoliday,
      label,
      nextDate,
      nextLabel,
      daysUntilNext,
      isHolidayYesterday,
      yesterdayLabel: isHolidayYesterday ? holidays[yesterday] : null,
      isHolidayTomorrow,
      tomorrowLabel: isHolidayTomorrow ? holidays[tomorrow] : null,
    };
  }

}

module.exports = HolidayService;
