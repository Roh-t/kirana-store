const DEFAULT_OPEN_TIME = '09:00';
const DEFAULT_CLOSE_TIME = '21:00';

export const DEFAULT_WEEKLY_SCHEDULE = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  isOpen: true,
  openTime: DEFAULT_OPEN_TIME,
  closeTime: DEFAULT_CLOSE_TIME
}));

const getZonedParts = (date, timezone) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  return Object.fromEntries(parts.filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, Number(value)]));
};

const zonedTimeToUtc = (parts, timezone) => {
  let timestamp = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const zoned = getZonedParts(new Date(timestamp), timezone);
    const offset = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute) - timestamp;
    timestamp = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - offset;
  }
  return new Date(timestamp);
};

const normalizeSchedule = (schedule) => {
  const byDay = new Map((schedule || []).map((entry) => [entry.dayOfWeek, entry]));
  return DEFAULT_WEEKLY_SCHEDULE.map((fallback) => ({ ...fallback, ...(byDay.get(fallback.dayOfWeek) || {}) }));
};

export const getStoreAvailability = (store, now = new Date()) => {
  const timezone = store.businessConfig?.timezone || 'Asia/Kolkata';
  const schedule = normalizeSchedule(store.businessConfig?.weeklySchedule);
  const current = getZonedParts(now, timezone);
  const today = schedule.find((entry) => entry.dayOfWeek === new Date(Date.UTC(current.year, current.month - 1, current.day)).getUTCDay());
  const currentMinutes = current.hour * 60 + current.minute;
  const openMinutes = today ? Number(today.openTime.slice(0, 2)) * 60 + Number(today.openTime.slice(3)) : 0;
  const closeMinutes = today ? Number(today.closeTime.slice(0, 2)) * 60 + Number(today.closeTime.slice(3)) : 0;
  const isWithinHours = Boolean(today?.isOpen) && (openMinutes <= closeMinutes
    ? currentMinutes >= openMinutes && currentMinutes < closeMinutes
    : currentMinutes >= openMinutes || currentMinutes < closeMinutes);
  const isOpen = Boolean(store.businessConfig?.isAcceptingOrders) && isWithinHours;

  if (isOpen) return { isOpen: true, nextOpeningAt: null };

  for (let dayOffset = 0; dayOffset <= 7; dayOffset += 1) {
    const date = new Date(Date.UTC(current.year, current.month - 1, current.day + dayOffset));
    const entry = schedule.find((item) => item.dayOfWeek === date.getUTCDay());
    if (!entry?.isOpen) continue;
    if (dayOffset === 0 && (openMinutes <= closeMinutes ? currentMinutes >= openMinutes : currentMinutes >= closeMinutes)) continue;
    const [hour, minute] = entry.openTime.split(':').map(Number);
    return {
      isOpen: false,
      nextOpeningAt: zonedTimeToUtc({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(), hour, minute }, timezone)
    };
  }

  return { isOpen: false, nextOpeningAt: null };
};