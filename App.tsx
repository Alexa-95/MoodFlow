import './global.css';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View, useWindowDimensions } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { AuthScreen } from './src/components/AuthScreen';
import type { AuthMode } from './src/components/AuthScreen';
import { Dashboard } from './src/components/Dashboard';
import {
  dateOffset,
  isEntryFilled,
  localDateKey,
  makeRange,
  metricValue,
} from './src/lib/dashboard';
import type { MetricKey } from './src/lib/dashboard';
import {
  addCustomTracker,
  cloudConfigIncomplete,
  cloudEnabled,
  loadSnapshot,
  saveDailyEntry,
  supabase,
} from './src/lib/backend';
import type { DailyEntry, Period, Tracker, TrackerType, TrackerValue } from './src/lib/types';
import { describeError } from './src/lib/errors';

export default function App() {
  const { width } = useWindowDimensions();
  const narrowLayout = width < 760;
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!cloudEnabled);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [period, setPeriod] = useState<Period>('month');
  const [metric, setMetric] = useState<MetricKey>('all');
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [savingEntry, setSavingEntry] = useState(false);
  const today = localDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [sleep, setSleep] = useState('');
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (active) {
          setUser(data.session?.user ?? null);
          setAuthReady(true);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(describeError(error, 'Nie udało się sprawdzić sesji.'));
          setAuthReady(true);
        }
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = user?.id ?? (cloudEnabled ? null : 'demo');
  const selectedDateValue = useMemo(() => new Date(`${selectedDate}T00:00:00`), [selectedDate]);
  const range = useMemo(() => makeRange(period, selectedDateValue), [period, selectedDateValue]);
  const calendarMonthStart = new Date(
    selectedDateValue.getFullYear(),
    selectedDateValue.getMonth(),
    1,
  );
  const calendarStart = new Date(calendarMonthStart);
  calendarStart.setDate(calendarStart.getDate() - ((calendarStart.getDay() + 6) % 7));
  const calendarEnd = new Date(calendarStart);
  calendarEnd.setDate(calendarEnd.getDate() + 41);
  const periodStart = range.from < localDateKey(calendarStart) ? range.from : localDateKey(calendarStart);
  const periodEnd = range.to > localDateKey(calendarEnd) ? range.to : localDateKey(calendarEnd);
  const snapshotRange = {
    from: periodStart,
    to: periodEnd,
  };

  useEffect(() => {
    let active = true;
    if (!userId) {
      setLoadingData(false);
      setEntries([]);
      setTrackers([]);
      return;
    }

    setLoadingData(true);
    setErrorMessage('');
    loadSnapshot(userId, snapshotRange.from, snapshotRange.to)
      .then((snapshot) => {
        if (!active) return;
        setTrackers(snapshot.trackers);
        setEntries(snapshot.entries);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(describeError(error, 'Nie udało się pobrać danych.'));
        }
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });

    return () => {
      active = false;
    };
  }, [userId, snapshotRange.from, snapshotRange.to]);

  useEffect(() => {
    const entry = entries.find((item) => item.entryDate === selectedDate);
    setMood(entry?.mood ?? null);
    setEnergy(entry?.energy ?? null);
    setSleep(entry?.sleep === null || entry?.sleep === undefined ? '' : String(entry.sleep));
    setCustomValues(
      Object.fromEntries(
        Object.entries(entry?.customValues ?? {}).map(([key, value]) => [key, String(value)]),
      ),
    );
  }, [entries, selectedDate]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.entryDate.localeCompare(b.entryDate)),
    [entries],
  );

  const displayEntries = useMemo(() => {
    let dates: string[];
    if (period === 'day') {
      dates = [selectedDate];
    } else if (period === 'week') {
      const monday = dateOffset(selectedDateValue, -((selectedDateValue.getDay() + 6) % 7));
      dates = Array.from({ length: 7 }, (_, index) =>
        localDateKey(dateOffset(monday, index)),
      );
    } else if (period === 'quarter') {
      dates = Array.from({ length: 90 }, (_, index) =>
        localDateKey(dateOffset(selectedDateValue, index - 89)),
      );
    } else {
      const monthStart = new Date(
        selectedDateValue.getFullYear(),
        selectedDateValue.getMonth(),
        1,
      );
      const gridStart = dateOffset(monthStart, -((monthStart.getDay() + 6) % 7));
      dates = Array.from({ length: 42 }, (_, index) =>
        localDateKey(dateOffset(gridStart, index)),
      );
    }

    return dates.map((date) => {
      const saved = sortedEntries.find((entry) => entry.entryDate === date);
      if (
        date === selectedDate &&
        (mood !== null ||
          energy !== null ||
          sleep !== '' ||
          Object.values(customValues).some((value) => value.trim() !== ''))
      ) {
        const draftCustomValues: Record<string, TrackerValue> = {};
        for (const [key, rawValue] of Object.entries(customValues)) {
          const tracker = trackers.find((item) => item.id === key);
          if (!tracker || rawValue.trim() === '') continue;
          if (tracker.type === 'text') {
            draftCustomValues[key] = rawValue;
          } else if (tracker.type === 'boolean') {
            if (rawValue === 'true' || rawValue === 'false') {
              draftCustomValues[key] = rawValue === 'true';
            }
          } else {
            const value = Number(rawValue);
            if (Number.isFinite(value)) draftCustomValues[key] = value;
          }
        }
        const draft: DailyEntry = {
          entryDate: selectedDate,
          mood,
          energy,
          sleep: sleep === '' ? null : Number(sleep),
          customValues: draftCustomValues,
        };
        return isEntryFilled(draft)
          ? draft
          : saved ?? { entryDate: date, mood: null, energy: null, sleep: null, customValues: {} };
      }
      return saved ?? { entryDate: date, mood: null, energy: null, sleep: null, customValues: {} };
    });
  }, [customValues, energy, mood, period, selectedDate, selectedDateValue, sleep, sortedEntries, trackers]);

  const completedDays = displayEntries.filter(
    (entry) =>
      (period !== 'month' || entry.entryDate.slice(0, 7) === selectedDate.slice(0, 7)) &&
      metricValue(entry, metric, trackers) !== null,
  ).length;
  const summaryEntries = sortedEntries.filter(
    (entry) => entry.entryDate >= range.from && entry.entryDate <= range.to,
  );
  const moodValues = summaryEntries.flatMap((entry) => (entry.mood === null ? [] : [entry.mood]));
  const energyValues = summaryEntries.flatMap((entry) =>
    entry.energy === null ? [] : [entry.energy],
  );
  const sleepValues = summaryEntries.flatMap((entry) => (entry.sleep === null ? [] : [entry.sleep]));

  async function handleAuth(): Promise<void> {
    if (!supabase) return;
    setAuthBusy(true);
    setAuthMessage('');
    setErrorMessage('');
    try {
      const result =
        authMode === 'signin'
          ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
          : await supabase.auth.signUp({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (authMode === 'signup' && !result.data.session) {
        setAuthMessage('Konto utworzone. Sprawdź skrzynkę e-mail, aby potwierdzić adres.');
      }
    } catch (error) {
      setErrorMessage(describeError(error, 'Nie udało się zalogować.'));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut(): Promise<void> {
    if (!supabase) return;
    setErrorMessage('');
    const { error } = await supabase.auth.signOut();
    if (error) setErrorMessage(describeError(error, 'Nie udało się wylogować.'));
  }

  async function handleSaveEntry(): Promise<void> {
    if (!userId) return;
    if (mood !== null && (!Number.isInteger(mood) || mood < -5 || mood > 5)) {
      setErrorMessage('Nastrój musi mieć wartość od -5 do 5.');
      return;
    }
    if (energy !== null && (!Number.isInteger(energy) || energy < 1 || energy > 10)) {
      setErrorMessage('Energia musi mieć wartość od 1 do 10.');
      return;
    }
    const parsedSleep = sleep.trim() === '' ? null : Number(sleep);
    if (parsedSleep !== null && (!Number.isFinite(parsedSleep) || parsedSleep < 0 || parsedSleep > 24)) {
      setErrorMessage('Sen wpisz jako liczbę godzin od 0 do 24.');
      return;
    }

    const savedCustomValues: Record<string, TrackerValue> = {};
    for (const tracker of trackers) {
      const rawValue = customValues[tracker.id]?.trim();
      if (!rawValue) continue;
      if (tracker.type === 'text') {
        savedCustomValues[tracker.id] = customValues[tracker.id];
        continue;
      }
      if (tracker.type === 'boolean') {
        if (rawValue !== 'true' && rawValue !== 'false') {
          setErrorMessage(`Wybierz „Tak” albo „Nie” dla wskaźnika „${tracker.name}”.`);
          return;
        }
        savedCustomValues[tracker.id] = rawValue === 'true';
        continue;
      }
      const value = Number(rawValue);
      if (!Number.isFinite(value) || value < 0 || value > tracker.scaleMax) {
        setErrorMessage(`Wskaźnik „${tracker.name}” musi mieć wartość od 0 do ${tracker.scaleMax}.`);
        return;
      }
      savedCustomValues[tracker.id] = value;
    }

    setSavingEntry(true);
    setErrorMessage('');
    const nextEntry: DailyEntry = {
      entryDate: selectedDate,
      mood,
      energy,
      sleep: parsedSleep,
      customValues: savedCustomValues,
    };
    try {
      await saveDailyEntry(userId, nextEntry);
      setEntries((previous) => [
        ...previous.filter((entry) => entry.entryDate !== selectedDate),
        nextEntry,
      ]);
    } catch (error) {
      setErrorMessage(describeError(error, 'Nie udało się zapisać wpisu.'));
    } finally {
      setSavingEntry(false);
    }
  }

  async function handleAddTracker(
    name: string,
    type: TrackerType,
    unit: string,
    scaleMax: number,
  ): Promise<void> {
    if (!userId) throw new Error('Najpierw zaloguj się na konto.');
    const tracker = await addCustomTracker(userId, name, type, unit, scaleMax);
    setTrackers((previous) => [...previous, tracker]);
  }

  if (cloudEnabled && !authReady) {
    return (
      <View className="flex-1 items-center justify-center bg-flow-bg">
        <ActivityIndicator color="#A8F27A" />
        <Text className="mt-[9px] text-xs text-flow-muted">Ładowanie MoodFlow…</Text>
      </View>
    );
  }

  if (cloudConfigIncomplete || (cloudEnabled && !user)) {
    return (
      <AuthScreen
        busy={authBusy}
        email={email}
        errorMessage={errorMessage}
        mode={authMode}
        onEmailChange={setEmail}
        onModeChange={(mode) => {
          setAuthMessage('');
          setErrorMessage('');
          setAuthMode(mode);
        }}
        onPasswordChange={setPassword}
        onSubmit={handleAuth}
        password={password}
        setupIncomplete={cloudConfigIncomplete}
        successMessage={authMessage}
      />
    );
  }

  return (
    <Dashboard
      cloudEnabled={cloudEnabled}
      completedDays={completedDays}
      customValues={customValues}
      email={user?.email}
      energy={energy}
      energyValues={energyValues}
      entries={displayEntries}
      errorMessage={errorMessage}
      selectedDate={selectedDate}
      loadingData={loadingData}
      metric={metric}
      mood={mood}
      moodValues={moodValues}
      narrowLayout={narrowLayout}
      onAddTracker={handleAddTracker}
      onCloseError={() => setErrorMessage('')}
      onCustomValueChange={(trackerId, value) =>
        setCustomValues((previous) => ({ ...previous, [trackerId]: value }))
      }
      onDateChange={setSelectedDate}
      onEnergyChange={setEnergy}
      onMetricChange={setMetric}
      onMoodChange={setMood}
      onPeriodChange={setPeriod}
      onSaveEntry={handleSaveEntry}
      onSignOut={handleSignOut}
      onSleepChange={setSleep}
      period={period}
      savingEntry={savingEntry}
      sleep={sleep}
      sleepValues={sleepValues}
      today={today}
      trackers={trackers}
    />
  );
}
