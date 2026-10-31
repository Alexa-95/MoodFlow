import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { DailyEntry, Tracker, TrackerSnapshot } from './types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const cloudEnabled = Boolean(supabaseUrl && supabaseKey);
export const cloudConfigIncomplete = Boolean(supabaseUrl) !== Boolean(supabaseKey);

export const supabase = cloudEnabled
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        ...(Platform.OS === 'web' ? {} : { storage: AsyncStorage }),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;

const LOCAL_KEY = 'moodflow-demo-data-v1';

type LocalData = TrackerSnapshot;

async function getLocalData(): Promise<LocalData> {
  const raw = await AsyncStorage.getItem(LOCAL_KEY);
  if (!raw) return { trackers: [], entries: [] };
  return JSON.parse(raw) as LocalData;
}

async function saveLocalData(data: LocalData): Promise<void> {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

export async function loadSnapshot(
  userId: string,
  from: string,
  to: string,
): Promise<TrackerSnapshot> {
  if (!supabase) {
    const data = await getLocalData();
    return {
      trackers: data.trackers,
      entries: data.entries.filter((entry) => entry.entryDate >= from && entry.entryDate <= to),
    };
  }

  const [{ data: trackerRows, error: trackerError }, { data: entryRows, error: entryError }] =
    await Promise.all([
      supabase.from('custom_trackers').select('id, name, unit, scale_max').eq('user_id', userId),
      supabase
        .from('daily_entries')
        .select('entry_date, mood, energy, sleep, custom_values')
        .eq('user_id', userId)
        .gte('entry_date', from)
        .lte('entry_date', to)
        .order('entry_date', { ascending: true }),
    ]);

  if (trackerError) throw trackerError;
  if (entryError) throw entryError;

  return {
    trackers: (trackerRows ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      unit: row.unit ?? '',
      scaleMax: row.scale_max,
    })),
    entries: (entryRows ?? []).map((row) => ({
      entryDate: row.entry_date,
      mood: row.mood,
      energy: row.energy,
      sleep: row.sleep,
      customValues: (row.custom_values ?? {}) as Record<string, number>,
    })),
  };
}

export async function saveDailyEntry(userId: string, entry: DailyEntry): Promise<void> {
  if (!supabase) {
    const data = await getLocalData();
    const index = data.entries.findIndex((item) => item.entryDate === entry.entryDate);
    if (index === -1) data.entries.push(entry);
    else data.entries[index] = entry;
    await saveLocalData(data);
    return;
  }

  const { error } = await supabase.from('daily_entries').upsert(
    {
      user_id: userId,
      entry_date: entry.entryDate,
      mood: entry.mood,
      energy: entry.energy,
      sleep: entry.sleep,
      custom_values: entry.customValues,
    },
    { onConflict: 'user_id,entry_date' },
  );
  if (error) throw error;
}

export async function addCustomTracker(
  userId: string,
  name: string,
  unit: string,
  scaleMax: number,
): Promise<Tracker> {
  if (!supabase) {
    const tracker = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      unit,
      scaleMax,
    };
    const data = await getLocalData();
    data.trackers.push(tracker);
    await saveLocalData(data);
    return tracker;
  }

  const { data, error } = await supabase
    .from('custom_trackers')
    .insert({ user_id: userId, name, unit, scale_max: scaleMax })
    .select('id, name, unit, scale_max')
    .single();
  if (error) throw error;
  return { id: data.id, name: data.name, unit: data.unit ?? '', scaleMax: data.scale_max };
}
