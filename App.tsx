import './global.css';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { PERIOD_DAYS } from './src/lib/types';
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
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [sleep, setSleep] = useState('');
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const initializedUserId = useRef<string | null>(null);

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
  const today = localDateKey(new Date());
  const range = useMemo(() => makeRange(period), [period]);

  useEffect(() => {
    let active = true;
    if (!userId) {
      setLoadingData(false);
      setEntries([]);
      setTrackers([]);
      initializedUserId.current = null;
      return;
    }

    setLoadingData(true);
    setErrorMessage('');
    loadSnapshot(userId, range.from, range.to)
      .then((snapshot) => {
        if (!active) return;
        setTrackers(snapshot.trackers);
        setEntries(snapshot.entries);
        if (initializedUserId.current !== userId) {
          const entry = snapshot.entries.find((item) => item.entryDate === today);
          setMood(entry?.mood ?? null);
          setEnergy(entry?.energy ?? null);
          setSleep(entry?.sleep === null || entry?.sleep === undefined ? '' : String(entry.sleep));
          setCustomValues(
            Object.fromEntries(
              Object.entries(entry?.customValues ?? {}).map(([key, value]) => [key, String(value)]),
            ),
          );
          initializedUserId.current = userId;
        }
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
  }, [userId, range.from, range.to, today]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.entryDate.localeCompare(b.entryDate)),
    [entries],
  );

  const displayEntries = useMemo(() => {
    const days = PERIOD_DAYS[period];
    return Array.from({ length: days }, (_, index) => {
      const date = localDateKey(dateOffset(new Date(), index - days + 1));
      const saved = sortedEntries.find((entry) => entry.entryDate === date);
      if (
        date === today &&
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
          entryDate: today,
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
  }, [customValues, energy, mood, period, sleep, sortedEntries, today, trackers]);

  const completedDays = displayEntries.filter(
    (entry) => metricValue(entry, metric, trackers) !== null,
  ).length;
  const moodValues = sortedEntries.flatMap((entry) => (entry.mood === null ? [] : [entry.mood]));
  const energyValues = sortedEntries.flatMap((entry) => (entry.energy === null ? [] : [entry.energy]));
  const sleepValues = sortedEntries.flatMap((entry) => (entry.sleep === null ? [] : [entry.sleep]));

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
      entryDate: today,
      mood,
      energy,
      sleep: parsedSleep,
      customValues: savedCustomValues,
    };
    try {
      await saveDailyEntry(userId, nextEntry);
      setEntries((previous) => [
        ...previous.filter((entry) => entry.entryDate !== today),
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
