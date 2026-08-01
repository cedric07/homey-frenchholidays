'use strict';

function shiftParisDateString(isoDate, deltaDays) {
  const year = parseInt(isoDate.slice(0, 4), 10);
  const month = parseInt(isoDate.slice(5, 7), 10);
  const day = parseInt(isoDate.slice(8, 10), 10);
  const d = new Date(Date.UTC(year, month - 1, day + deltaDays));
  return d.toISOString().slice(0, 10);
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function schoolHolidayTypeFromLabel(label) {
  const text = normalizeText(label);
  if (!text) return null;
  if (text.includes('toussaint')) return 'toussaint';
  if (text.includes('noel')) return 'noel';
  if (text.includes('hiver')) return 'hiver';
  if (text.includes('printemps')) return 'printemps';
  if (text.includes('ete')) return 'ete';
  return 'other';
}

function isActiveOnDate(periods, isoDate) {
  return periods.some((period) => isoDate >= period.startDate && isoDate < period.endDate);
}

function labelOnDate(periods, isoDate) {
  const period = periods.find((p) => isoDate >= p.startDate && isoDate < p.endDate);
  return period ? period.label : null;
}

module.exports = {
  shiftParisDateString,
  schoolHolidayTypeFromLabel,
  isActiveOnDate,
  labelOnDate,
};
