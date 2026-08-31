import { isValid, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const BRASILIA_TIME_ZONE = "America/Sao_Paulo";
const ISO_WITH_ZONE_PATTERN = "yyyy-MM-dd'T'HH:mm:ssXXX";

function parseDateInput(dateInput) {
  if (dateInput instanceof Date) return new Date(dateInput.getTime());
  if (typeof dateInput === "number") return new Date(dateInput);

  if (typeof dateInput === "string") {
    const value = dateInput.trim();
    const hasExplicitZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
    return hasExplicitZone
      ? parseISO(value)
      : fromZonedTime(value, BRASILIA_TIME_ZONE);
  }

  return new Date(dateInput);
}

export function toBrasiliaISO(dateInput) {
  if (!dateInput) return null;
  const date = parseDateInput(dateInput);
  return isValid(date)
    ? formatInTimeZone(date, BRASILIA_TIME_ZONE, ISO_WITH_ZONE_PATTERN)
    : null;
}

export function toBrasiliaDate(dateInput) {
  if (!dateInput) return null;
  const date = parseDateInput(dateInput);
  return isValid(date) ? date : null;
}

export function formatToBrasilia(dateInput) {
  const date = toBrasiliaDate(dateInput);
  return date
    ? formatInTimeZone(date, BRASILIA_TIME_ZONE, "dd/MM/yyyy HH:mm")
    : "";
}

export function toDateTimeLocalBrasilia(dateInput) {
  const date = toBrasiliaDate(dateInput);
  return date
    ? formatInTimeZone(date, BRASILIA_TIME_ZONE, "yyyy-MM-dd'T'HH:mm")
    : "";
}

export function nowBrasiliaISO() {
  return formatInTimeZone(new Date(), BRASILIA_TIME_ZONE, ISO_WITH_ZONE_PATTERN);
}

export function nowBrasilia() {
  return new Date();
}

export { BRASILIA_TIME_ZONE };
