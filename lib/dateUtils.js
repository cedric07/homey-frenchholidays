'use strict';

const { TIMEZONE } = require('./constants');

function toParisDateString(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

function parseParisDate(isoString) {
  return toParisDateString(new Date(isoString));
}

function startOfParisDay(date = new Date()) {
  const str = toParisDateString(date);
  return new Date(`${str}T00:00:00`);
}

function daysBetween(fromDate, toDate) {
  const from = startOfParisDay(fromDate).getTime();
  const to = startOfParisDay(toDate).getTime();
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

function getParisTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parseInt(parts.find((p) => p.type === type).value, 10);
  return { hour: get('hour'), minute: get('minute'), second: get('second') };
}

// Scan forward minute-by-minute: DST makes a fixed UTC offset unreliable for Paris local time.
function msUntilNextParisTime(hour, minute, second = 0) {
  const now = Date.now();
  let probe = Math.floor(now / 60000) * 60000;

  for (let i = 0; i < 48 * 60; i += 1) {
    probe += 60000;
    if (probe <= now) continue;

    const parts = getParisTimeParts(new Date(probe));
    if (parts.hour === hour && parts.minute === minute && parts.second === second) {
      return probe - now;
    }
  }

  return 24 * 60 * 60 * 1000;
}

function shiftParisDate(date = new Date(), deltaDays = 0) {
  const str = toParisDateString(date);
  const year = parseInt(str.slice(0, 4), 10);
  const month = parseInt(str.slice(5, 7), 10);
  const day = parseInt(str.slice(8, 10), 10);
  return new Date(Date.UTC(year, month - 1, day + deltaDays));
}

module.exports = {
  toParisDateString,
  parseParisDate,
  startOfParisDay,
  daysBetween,
  getParisTimeParts,
  msUntilNextParisTime,
  shiftParisDate,
};
