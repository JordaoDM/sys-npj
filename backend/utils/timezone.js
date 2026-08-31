const { isValid, parseISO } = require('date-fns');
const { formatInTimeZone, fromZonedTime } = require('date-fns-tz');

const BRASILIA_TIME_ZONE = 'America/Sao_Paulo';
const ISO_WITH_ZONE_PATTERN = "yyyy-MM-dd'T'HH:mm:ssXXX";

function parseDateInput(dateInput) {
  if (dateInput instanceof Date) return new Date(dateInput.getTime());
  if (typeof dateInput === 'number') return new Date(dateInput);

  if (typeof dateInput === 'string') {
    const value = dateInput.trim();
    const hasExplicitZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
    return hasExplicitZone
      ? parseISO(value)
      : fromZonedTime(value, BRASILIA_TIME_ZONE);
  }

  return new Date(dateInput);
}

function toBrasiliaISO(dateInput) {
  if (!dateInput) return null;
  const date = parseDateInput(dateInput);
  return isValid(date)
    ? formatInTimeZone(date, BRASILIA_TIME_ZONE, ISO_WITH_ZONE_PATTERN)
    : null;
}

function toBrasiliaDate(dateInput) {
  if (!dateInput) return null;
  const date = parseDateInput(dateInput);
  return isValid(date) ? date : null;
}

function formatToBrasilia(dateInput) {
  const date = toBrasiliaDate(dateInput);
  return date
    ? formatInTimeZone(date, BRASILIA_TIME_ZONE, 'dd/MM/yyyy HH:mm')
    : '';
}

function toDateTimeLocalBrasilia(dateInput) {
  const date = toBrasiliaDate(dateInput);
  return date
    ? formatInTimeZone(date, BRASILIA_TIME_ZONE, "yyyy-MM-dd'T'HH:mm")
    : '';
}

function nowBrasiliaISO() {
  return formatInTimeZone(new Date(), BRASILIA_TIME_ZONE, ISO_WITH_ZONE_PATTERN);
}

function nowBrasilia() {
  return new Date();
}

function nowTimestamp() {
  return Date.now();
}

module.exports = {
  BRASILIA_TIME_ZONE,
  toBrasiliaISO,
  toBrasiliaDate,
  formatToBrasilia,
  toDateTimeLocalBrasilia,
  nowBrasiliaISO,
  nowBrasilia,
  nowTimestamp
};
