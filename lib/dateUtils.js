'use strict';

const { TIMEZONE } = require('./constants');

function toParisDateString(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

function getParisCalendar(date = new Date()) {
  const str = toParisDateString(date);
  const [year, month, day] = str.split('-').map(Number);
  return { year, month, day };
}

function getParisWeekday(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    weekday: 'short',
  }).format(date);
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

function isWeekend(date = new Date()) {
  const weekday = getParisWeekday(date);
  return weekday === 'Sat' || weekday === 'Sun';
}

function dayOfYear(date = new Date()) {
  const { year, month, day } = getParisCalendar(date);
  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  return Math.floor((current - start) / 86400000) + 1;
}

function weekdayOccurrenceInMonth(date = new Date()) {
  const { day } = getParisCalendar(date);
  return Math.ceil(day / 7);
}

function isLastWeekdayOccurrenceInMonth(date = new Date()) {
  const { year, month, day } = getParisCalendar(date);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day + 7 > daysInMonth;
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

module.exports = {
  toParisDateString,
  getParisCalendar,
  getParisWeekday,
  parseParisDate,
  startOfParisDay,
  daysBetween,
  isWeekend,
  dayOfYear,
  weekdayOccurrenceInMonth,
  isLastWeekdayOccurrenceInMonth,
  getParisTimeParts,
  msUntilNextParisTime,
};
