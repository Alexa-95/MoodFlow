import { ScrollView, Text, View } from 'react-native';
import type { DailyEntry, Period, Tracker, TrackerType } from '../lib/types';
import type { MetricKey } from '../lib/dashboard';
import { DailyCheckInCard } from './DailyCheckInCard';
import { DashboardHeader } from './DashboardHeader';
import { HeatmapCard } from './HeatmapCard';
import { Notice } from './ui/Notice';
import { PrivacyCard } from './PrivacyCard';
import { SummaryCard } from './SummaryCard';
import { TrackerForm } from './TrackerForm';

type Props = {
  narrowLayout: boolean;
  cloudEnabled: boolean;
  email?: string;
  errorMessage: string;
  period: Period;
  metric: MetricKey;
  trackers: Tracker[];
  entries: DailyEntry[];
  today: string;
  completedDays: number;
  loadingData: boolean;
  savingEntry: boolean;
  mood: number | null;
  energy: number | null;
  sleep: string;
  customValues: Record<string, string>;
  moodValues: number[];
  energyValues: number[];
  sleepValues: number[];
  onSignOut: () => void;
  onCloseError: () => void;
  onPeriodChange: (period: Period) => void;
  onMetricChange: (metric: MetricKey) => void;
  onMoodChange: (value: number | null) => void;
  onEnergyChange: (value: number | null) => void;
  onSleepChange: (value: string) => void;
  onCustomValueChange: (trackerId: string, value: string) => void;
  onSaveEntry: () => void;
  onAddTracker: (
    name: string,
    type: TrackerType,
    unit: string,
    scaleMax: number,
  ) => Promise<void>;
};

export function Dashboard({
  narrowLayout,
  cloudEnabled,
  email,
  errorMessage,
  period,
  metric,
  trackers,
  entries,
  today,
  completedDays,
  loadingData,
  savingEntry,
  mood,
  energy,
  sleep,
  customValues,
  moodValues,
  energyValues,
  sleepValues,
  onSignOut,
  onCloseError,
  onPeriodChange,
  onMetricChange,
  onMoodChange,
  onEnergyChange,
  onSleepChange,
  onCustomValueChange,
  onSaveEntry,
  onAddTracker,
}: Props) {
  return (
    <View className="flex-1 bg-flow-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName={`flex-grow pb-8 ${
          narrowLayout ? 'px-4' : 'px-6'
        }`}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-[1120px] self-center">
          <DashboardHeader
            cloudEnabled={cloudEnabled}
            email={email}
            narrowLayout={narrowLayout}
            onSignOut={onSignOut}
          />

          {errorMessage ? (
            <Notice message={errorMessage} tone="error" onClose={onCloseError} />
          ) : null}

          <View
            className={`gap-[18px] ${
              narrowLayout ? 'flex-col items-stretch' : 'flex-row items-start'
            }`}
          >
            <View className={`gap-[18px] ${narrowLayout ? 'w-full' : 'min-w-0 flex-[1.65]'}`}>
              <DailyCheckInCard
                customValues={customValues}
                energy={energy}
                mood={mood}
                onCustomValueChange={onCustomValueChange}
                onEnergyChange={onEnergyChange}
                onMoodChange={onMoodChange}
                onSave={onSaveEntry}
                onSleepChange={onSleepChange}
                saving={savingEntry}
                sleep={sleep}
                trackers={trackers}
              />
              <HeatmapCard
                completedDays={completedDays}
                entries={entries}
                loading={loadingData}
                metric={metric}
                onMetricChange={onMetricChange}
                onPeriodChange={onPeriodChange}
                period={period}
                today={today}
                trackers={trackers}
              />
            </View>

            <View className={`gap-[18px] ${narrowLayout ? 'w-full' : 'min-w-0 flex-1'}`}>
              <SummaryCard
                energyValues={energyValues}
                moodValues={moodValues}
                period={period}
                sleepValues={sleepValues}
              />
              <TrackerForm onAdd={onAddTracker} trackers={trackers} />
              <PrivacyCard cloudEnabled={cloudEnabled} />
            </View>
          </View>

          <Text className="pt-[26px] text-center text-[10px] text-[#64718A]">
            MoodFlow · krok po kroku, w Twoim tempie
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
