import { PERIOD_DAYS } from './types';
import type { DailyEntry, Period, Tracker } from './types';

export type MetricKey = 'all' | 'mood' | 'energy' | 'sleep' | string;

export const PERIODS: { id: Period; label: string; caption: string }[] = [
  { id: 'day', label: 'Dzień', caption: '1 dzień' },
  { id: 'week', label: 'Tydzień', caption: '7 dni' },
  { id: 'month', label: 'Miesiąc', caption: '30 dni' },
  { id: 'quarter', label: 'Kwartał', caption: '90 dni' },
];

export const MOOD_LABELS = ['Bardzo słabo', 'Słabo', 'Średnio', 'Dobrze', 'Świetnie'];
export const ENERGY_LABELS = ['Brak', 'Niska', 'Umiarkowana', 'Dobra', 'Wysoka'];

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateOffset(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

export function makeRange(period: Period): { from: string; to: string } {
  const today = new Date();
  return {
    from: localDateKey(dateOffset(today, -(PERIOD_DAYS[period] - 1))),
    to: localDateKey(today),
  };
}

export function isEntryFilled(entry: DailyEntry): boolean {
  return (
    entry.mood !== null ||
    entry.energy !== null ||
    entry.sleep !== null ||
    Object.keys(entry.customValues).length > 0
  );
}

function getMetricValues(entry: DailyEntry, trackers: Tracker[]): number[] {
  return [
    ...(entry.mood === null ? [] : [entry.mood / 5]),
    ...(entry.energy === null ? [] : [entry.energy / 5]),
    ...(entry.sleep === null ? [] : [Math.min(entry.sleep / 10, 1)]),
    ...trackers.flatMap((tracker) => {
      if (tracker.type === 'text') return [];
      const value = entry.customValues[tracker.id];
      if (tracker.type === 'boolean') {
        return typeof value === 'boolean' ? [value ? 1 : 0] : [];
      }
      return typeof value === 'number' ? [Math.min(value / tracker.scaleMax, 1)] : [];
    }),
  ];
}

export function metricValue(
  entry: DailyEntry,
  key: MetricKey,
  trackers: Tracker[],
): number | null {
  if (key === 'all') {
    const values = getMetricValues(entry, trackers);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  }
  if (key === 'mood') return entry.mood === null ? null : entry.mood / 5;
  if (key === 'energy') return entry.energy === null ? null : entry.energy / 5;
  if (key === 'sleep') return entry.sleep === null ? null : Math.min(entry.sleep / 10, 1);
  const tracker = trackers.find((item) => item.id === key);
  const value = entry.customValues[key];
  if (!tracker || value === undefined || tracker.type === 'text') return null;
  if (tracker.type === 'boolean') return typeof value === 'boolean' ? Number(value) : null;
  return typeof value === 'number' ? Math.min(value / tracker.scaleMax, 1) : null;
}

export function pixelColor(value: number | null): string {
  if (value === null) return '#202B40';
  if (value < 0.2) return '#F27E91';
  if (value < 0.4) return '#F5B968';
  if (value < 0.6) return '#E8DC73';
  if (value < 0.8) return '#9DDD77';
  return '#52C8B2';
}

export function formatAverage(values: number[]): string {
  if (!values.length) return '—';
  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
}
