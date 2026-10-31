export type TrackerType = 'number' | 'text' | 'boolean';

export type TrackerValue = number | string | boolean;

export type Tracker = {
  id: string;
  name: string;
  type: TrackerType;
  unit: string;
  scaleMax: number;
};

export type DailyEntry = {
  entryDate: string;
  mood: number | null;
  energy: number | null;
  sleep: number | null;
  customValues: Record<string, TrackerValue>;
};

export type TrackerSnapshot = {
  trackers: Tracker[];
  entries: DailyEntry[];
};

export type Period = 'day' | 'week' | 'month' | 'quarter';

export const PERIOD_DAYS: Record<Period, number> = {
  day: 1,
  week: 7,
  month: 30,
  quarter: 90,
};
