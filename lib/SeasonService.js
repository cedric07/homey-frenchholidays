'use strict';

const { toParisDateString, daysBetween } = require('./dateUtils');

const SEASON_NAMES = {
  fr: {
    winter: 'Hiver', spring: 'Printemps', summer: 'Été', fall: 'Automne',
  },
  en: {
    winter: 'Winter', spring: 'Spring', summer: 'Summer', fall: 'Fall',
  },
};

class SeasonService {

  _getSeasonBoundaries(year) {
    return {
      spring: `${year}-03-20`,
      summer: `${year}-06-21`,
      fall: `${year}-09-22`,
      winter: `${year}-12-21`,
    };
  }

  getSeason(date = new Date()) {
    const today = toParisDateString(date);
    const year = parseInt(today.slice(0, 4), 10);
    const bounds = this._getSeasonBoundaries(year);

    if (today >= bounds.winter || today < bounds.spring) return 'winter';
    if (today >= bounds.spring && today < bounds.summer) return 'spring';
    if (today >= bounds.summer && today < bounds.fall) return 'summer';
    return 'fall';
  }

  getNextSeasonInfo(date = new Date()) {
    const today = toParisDateString(date);
    const year = parseInt(today.slice(0, 4), 10);
    const current = this.getSeason(date);
    const order = ['winter', 'spring', 'summer', 'fall'];
    const currentIdx = order.indexOf(current);
    const nextSeason = order[(currentIdx + 1) % 4];

    const boundsThisYear = this._getSeasonBoundaries(year);
    const boundsNextYear = this._getSeasonBoundaries(year + 1);

    const nextDates = {
      spring: boundsThisYear.spring,
      summer: boundsThisYear.summer,
      fall: boundsThisYear.fall,
      winter: today >= boundsThisYear.winter ? boundsNextYear.winter : boundsThisYear.winter,
    };

    const nextDate = nextDates[nextSeason];
    return {
      current,
      next: nextSeason,
      daysUntilNext: daysBetween(date, new Date(`${nextDate}T00:00:00`)),
      nextDate,
    };
  }

  getSeasonName(season, lang = 'fr') {
    return SEASON_NAMES[lang]?.[season] || season;
  }

}

module.exports = SeasonService;
