'use strict';

const SunCalc = require('suncalc');
const { MOON_PHASES } = require('./constants');

const PHASE_NAMES = {
  fr: {
    new: 'Nouvelle lune',
    waxing_crescent: 'Premier croissant',
    first_quarter: 'Premier quartier',
    waxing_gibbous: 'Gibbeuse croissante',
    full: 'Pleine lune',
    waning_gibbous: 'Gibbeuse décroissante',
    last_quarter: 'Dernier quartier',
    waning_crescent: 'Dernier croissant',
  },
  en: {
    new: 'New moon',
    waxing_crescent: 'Waxing crescent',
    first_quarter: 'First quarter',
    waxing_gibbous: 'Waxing gibbous',
    full: 'Full moon',
    waning_gibbous: 'Waning gibbous',
    last_quarter: 'Last quarter',
    waning_crescent: 'Waning crescent',
  },
};

class MoonService {

  getPhaseId(phaseValue) {
    const normalized = phaseValue >= 1 ? 0 : phaseValue;
    for (const item of MOON_PHASES) {
      if (normalized >= item.min && normalized < item.max) return item.id;
    }
    return 'full';
  }

  getInfo(date = new Date(), lang = 'fr') {
    const illumination = SunCalc.getMoonIllumination(date);
    const { phase } = illumination;
    const phaseId = this.getPhaseId(phase);
    const age = this._getMoonAge(date);
    const { distance } = SunCalc.getMoonPosition(date, 0, 0);

    return {
      phase: Math.round(phase * 100) / 100,
      phaseId,
      name: PHASE_NAMES[lang]?.[phaseId] || PHASE_NAMES.fr[phaseId],
      age: Math.round(age * 10) / 10,
      illumination: Math.round(illumination.fraction * 100) / 100,
      distance: Math.round(distance),
    };
  }

  _getMoonAge(date) {
    const synodic = 29.530588853;
    const { phase } = SunCalc.getMoonIllumination(date);
    return phase * synodic;
  }

}

module.exports = MoonService;
