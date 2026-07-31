'use strict';

const { CACHE_TTL } = require('./constants');
const { toParisDateString, daysBetween } = require('./dateUtils');

const SCHOOL_API_BASE = 'https://data.education.gouv.fr/api/v2/catalog/datasets/fr-en-calendrier-scolaire/records';
const ICS_BASE = 'https://fr.ftp.opendatasoft.com/openscol/fr-en-calendrier-scolaire';

const ICS_ZONE_FILES = {
  'Zone A': 'Zone-A.ics',
  'Zone B': 'Zone-B.ics',
  'Zone C': 'Zone-C.ics',
  Corse: 'Corse.ics',
  Guadeloupe: 'Guadeloupe.ics',
  Martinique: 'Martinique.ics',
  Guyane: 'Guyane.ics',
  'La Réunion': 'Reunion.ics',
  Mayotte: 'Mayotte.ics',
  'Nouvelle-Calédonie': 'Nouvelle-Caledonie.ics',
  'Polynésie française': 'Polynesie.ics',
};

class SchoolHolidayService {

  constructor(cache, log, error) {
    this.cache = cache;
    this.log = log;
    this.error = error;
  }

  async _fetchFromApi(zone) {
    const url = `${SCHOOL_API_BASE}?where=${encodeURIComponent(`zones="${zone}"`)}&limit=100&offset=`;
    const events = [];
    let offset = 0;
    let total = Infinity;

    while (offset < total) {
      const response = await fetch(`${url}${offset}`);
      if (!response.ok) {
        throw new Error(`School holiday API error ${response.status}`);
      }
      const body = await response.json();
      total = body.total_count;
      for (const item of body.records) {
        events.push(this._normalizeRecord(item.record.fields));
      }
      offset += body.records.length;
      if (body.records.length === 0) break;
    }

    return this._deduplicateEvents(events);
  }

  _normalizeRecord(fields) {
    return {
      description: fields.description,
      startDate: toParisDateString(new Date(fields.start_date)),
      endDate: toParisDateString(new Date(fields.end_date)),
      schoolYear: fields.annee_scolaire,
    };
  }

  _deduplicateEvents(events) {
    const seen = new Set();
    return events.filter((event) => {
      const key = `${event.description}|${event.startDate}|${event.endDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  _parseIcsDate(value) {
    if (!value) return null;
    if (value.length === 8) {
      return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
    }
    return toParisDateString(new Date(value));
  }

  _parseIcsEvents(icsText) {
    const events = [];
    const blocks = icsText.split('BEGIN:VEVENT');

    for (const block of blocks.slice(1)) {
      const summary = (block.match(/SUMMARY:(.+)/) || [])[1];
      const dtStart = (block.match(/DTSTART(?:;VALUE=DATE)?:(\S+)/) || [])[1];
      const dtEnd = (block.match(/DTEND(?:;VALUE=DATE)?:(\S+)/) || [])[1];
      const description = (block.match(/DESCRIPTION:(.+)/) || [])[1];

      if (!dtStart) continue;

      events.push({
        description: (summary || description || '').trim(),
        startDate: this._parseIcsDate(dtStart),
        endDate: dtEnd ? this._parseIcsDate(dtEnd) : this._parseIcsDate(dtStart),
      });
    }

    return this._deduplicateEvents(events);
  }

  async _fetchFromIcs(zone) {
    const file = ICS_ZONE_FILES[zone];
    if (!file) throw new Error(`No ICS file for zone ${zone}`);

    const response = await fetch(`${ICS_BASE}/${file}`);
    if (!response.ok) {
      throw new Error(`ICS fetch error ${response.status}`);
    }
    const text = await response.text();
    return this._parseIcsEvents(text);
  }

  async getEvents(zone, { force = false } = {}) {
    if (force) {
      this.cache.invalidate('schoolHolidays', zone);
    }
    const cached = this.cache.getValid('schoolHolidays', zone);
    if (cached) return cached;

    try {
      const data = await this._fetchFromApi(zone);
      this.cache.set('schoolHolidays', zone, data, CACHE_TTL.schoolHolidays);
      return data;
    } catch (apiErr) {
      this.error('[SchoolHolidayService] API failed:', apiErr.message);
      try {
        const data = await this._fetchFromIcs(zone);
        this.cache.set('schoolHolidays', zone, data, CACHE_TTL.schoolHolidays);
        return data;
      } catch (icsErr) {
        this.error('[SchoolHolidayService] ICS failed:', icsErr.message);
        const stale = this.cache.getStale('schoolHolidays', zone);
        if (stale) return stale;
        throw icsErr;
      }
    }
  }

  _deduplicatePeriods(periods) {
    const seen = new Set();
    return periods.filter((period) => {
      const key = `${period.label}|${period.startDate}|${period.endDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ICS fallback only: other vacations already have full date ranges; summer may be split
  // ("Début des Vacances" + "Rentrée scolaire") or incomplete for future school years.
  _buildIcsSummerPeriods(events) {
    const startsByYear = new Map();
    const endsByYear = new Map();

    for (const event of events) {
      const desc = event.description || '';
      const year = event.startDate.slice(0, 4);

      if (desc.includes('Début des Vacances')
        || (desc.includes("Vacances d'Été") && event.startDate === event.endDate)) {
        startsByYear.set(year, event.startDate);
      }

      if (desc.includes('Rentrée scolaire')) {
        endsByYear.set(year, event.startDate);
      }
    }

    const periods = [];
    for (const [year, startDate] of startsByYear) {
      const endDate = endsByYear.get(year);
      if (endDate) {
        periods.push({
          label: "Vacances d'été",
          startDate,
          endDate,
        });
      }
    }
    return periods;
  }

  _buildPeriods(events) {
    const periods = [];
    let hasFullSummerPeriod = false;

    for (const event of events) {
      const desc = event.description || '';
      const hasRange = event.endDate && event.endDate !== event.startDate;

      if (desc.includes("Vacances d'Été") && hasRange) {
        periods.push({
          label: "Vacances d'été",
          startDate: event.startDate,
          endDate: event.endDate,
        });
        hasFullSummerPeriod = true;
        continue;
      }

      if (desc.includes('Début des Vacances')
        || desc.includes('Rentrée scolaire')
        || (desc.includes("Vacances d'Été") && !hasRange)) {
        continue;
      }

      if (hasRange) {
        periods.push({
          label: desc,
          startDate: event.startDate,
          endDate: event.endDate,
        });
      }
    }

    if (!hasFullSummerPeriod) {
      periods.push(...this._buildIcsSummerPeriods(events));
    }

    return this._deduplicatePeriods(periods).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  async getHolidayInfo(zone, date = new Date()) {
    const events = await this.getEvents(zone);
    const periods = this._buildPeriods(events);
    const today = toParisDateString(date);

    let isActive = false;
    let currentLabel = null;
    let nextPeriod = null;
    let daysUntilNext = null;
    let daysUntilEnd = null;

    for (const period of periods) {
      if (today >= period.startDate && today < period.endDate) {
        isActive = true;
        currentLabel = period.label;
        daysUntilEnd = daysBetween(date, new Date(`${period.endDate}T00:00:00`));
      }
    }

    for (const period of periods) {
      if (period.startDate > today) {
        if (!nextPeriod || period.startDate < nextPeriod.startDate) {
          nextPeriod = period;
        }
      }
    }

    if (nextPeriod) {
      daysUntilNext = daysBetween(date, new Date(`${nextPeriod.startDate}T00:00:00`));
    }

    const startsToday = periods.some((p) => p.startDate === today);
    const endedYesterday = periods.some((p) => p.endDate === today);

    return {
      isActive,
      currentLabel,
      nextLabel: nextPeriod ? nextPeriod.label : null,
      daysUntilNext,
      daysUntilEnd,
      startsToday,
      endedToday: endedYesterday,
    };
  }

}

module.exports = SchoolHolidayService;
