const {
  addDays: addDateFnsDays,
  addHours: addDateFnsHours,
  addMinutes: addDateFnsMinutes,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  endOfDay: dateFnsEndOfDay,
  format,
  formatISO: dateFnsFormatISO,
  isAfter,
  isBefore,
  isToday: dateFnsIsToday,
  parseISO,
  startOfDay: dateFnsStartOfDay
} = require('date-fns');

function parseDate(date) {
  return typeof date === 'string' ? parseISO(date) : new Date(date);
}

function toUTC(date) {
  return parseDate(date);
}

function fromUTC(date) {
  return parseDate(date);
}

function formatISO(date) {
  return dateFnsFormatISO(parseDate(date));
}

function isToday(date) {
  return dateFnsIsToday(parseDate(date));
}

function isFuture(date) {
  return isAfter(parseDate(date), new Date());
}

function isPast(date) {
  return isBefore(parseDate(date), new Date());
}

function addMinutes(date, minutes) {
  return addDateFnsMinutes(parseDate(date), minutes);
}

function addHours(date, hours) {
  return addDateFnsHours(parseDate(date), hours);
}

function addDays(date, days) {
  return addDateFnsDays(parseDate(date), days);
}

function diffInMinutes(date1, date2) {
  return differenceInMinutes(parseDate(date2), parseDate(date1));
}

function diffInHours(date1, date2) {
  return differenceInHours(parseDate(date2), parseDate(date1));
}

function diffInDays(date1, date2) {
  return differenceInDays(parseDate(date2), parseDate(date1));
}

function formatBrazilian(date) {
  return format(parseDate(date), 'dd/MM/yyyy HH:mm');
}

function startOfDay(date) {
  return dateFnsStartOfDay(parseDate(date));
}

function endOfDay(date) {
  return dateFnsEndOfDay(parseDate(date));
}

module.exports = {
  toUTC,
  fromUTC,
  formatISO,
  isToday,
  isFuture,
  isPast,
  addMinutes,
  addHours,
  addDays,
  diffInMinutes,
  diffInHours,
  diffInDays,
  formatBrazilian,
  startOfDay,
  endOfDay
};
