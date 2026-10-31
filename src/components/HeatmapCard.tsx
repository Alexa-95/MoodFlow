import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { PERIODS, metricValue, pixelColor } from '../lib/dashboard';
import type { DailyEntry, Period, Tracker } from '../lib/types';
import type { MetricKey } from '../lib/dashboard';

type Props = {
  period: Period;
  metric: MetricKey;
  entries: DailyEntry[];
  trackers: Tracker[];
  today: string;
  completedDays: number;
  loading: boolean;
  onPeriodChange: (period: Period) => void;
  onMetricChange: (metric: MetricKey) => void;
};

const METRICS = [
  { key: 'all', label: 'Wszystko' },
  { key: 'mood', label: 'Nastrój' },
  { key: 'energy', label: 'Energia' },
  { key: 'sleep', label: 'Sen' },
];

const GRID_COLUMNS = 7;
const GRID_GAP = 6;

export function HeatmapCard({
  period,
  metric,
  entries,
  trackers,
  today,
  completedDays,
  loading,
  onPeriodChange,
  onMetricChange,
}: Props) {
  const [gridWidth, setGridWidth] = useState(0);
  const pixelSize = gridWidth
    ? Math.floor((gridWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS)
    : 0;

  return (
    <View className="min-h-[310px] rounded-[18px] border border-flow-border bg-flow-surface p-[22px]">
      <View className="mb-[22px] flex-row items-center justify-between gap-3">
        <View>
          <Text className="mb-[7px] text-[9px] font-bold tracking-[1.4px] text-flow-muted">
            TWÓJ RYTM
          </Text>
          <Text className="text-lg font-semibold tracking-[-0.3px] text-flow-text">
            Mapa samopoczucia
          </Text>
        </View>
        <Text className="text-[11px] text-flow-muted">{completedDays} dni z wpisem</Text>
      </View>

      <View className="mb-[17px] flex-row rounded-xl bg-flow-bg p-1">
        {PERIODS.map((item) => {
          const selected = period === item.id;
          return (
            <Pressable
              key={item.id}
              className={`flex-1 items-center rounded-[9px] px-1 py-[9px] ${
                selected ? 'bg-flow-raised' : ''
              }`}
              onPress={() => onPeriodChange(item.id)}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  selected ? 'text-flow-text' : 'text-flow-muted'
                }`}
              >
                {item.label}
              </Text>
              <Text
                className={`mt-[3px] text-[9px] ${
                  selected ? 'text-flow-accent' : 'text-[#718098]'
                }`}
              >
                {item.caption}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="mb-[17px] flex-row gap-[7px]">
          {          [
            ...METRICS,
            ...trackers
              .filter((tracker) => tracker.type !== 'text')
              .map((tracker) => ({ key: tracker.id, label: tracker.name })),
          ].map(
            (item) => {
              const selected = metric === item.key;
              return (
                <Pressable
                  key={item.key}
                  className={`rounded-full border px-[11px] py-[7px] ${
                    selected
                      ? 'border-[#46683D] bg-flow-accent-dark'
                      : 'border-flow-border'
                  }`}
                  onPress={() => onMetricChange(item.key)}
                >
                  <Text
                    className={`text-[10px] font-semibold ${
                      selected ? 'text-flow-accent' : 'text-flow-muted'
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>
      </ScrollView>

      <View className="min-h-[108px] w-full justify-center">
        {loading ? (
          <View className="flex-row items-center gap-2.5 py-6">
            <ActivityIndicator color="#A8F27A" />
            <Text className="text-xs text-flow-muted">Ładowanie wpisów…</Text>
          </View>
        ) : (
          <View
            className="w-full flex-row flex-wrap justify-start gap-[6px]"
            onLayout={(event) => {
              const nextWidth = event.nativeEvent.layout.width;
              setGridWidth((previous) => (previous === nextWidth ? previous : nextWidth));
            }}
          >
            {entries.map((entry) => {
              const value = metricValue(entry, metric, trackers);
              return (
                <View
                  key={entry.entryDate}
                  accessibilityLabel={`${entry.entryDate}: ${
                    value === null ? 'brak wpisu' : `${Math.round(value * 100)}%`
                  }`}
                  className={`rounded-[5px] ${
                    entry.entryDate === today ? 'border-2 border-flow-text' : ''
                  }`}
                  style={{
                    width: pixelSize,
                    height: pixelSize,
                    backgroundColor: pixelColor(value),
                  }}
                />
              );
            })}
          </View>
        )}
        {!loading && completedDays === 0 ? (
          <Text className="mt-[13px] text-[11px] leading-[17px] text-flow-muted">
            Twoje wpisy pojawią się tutaj jako kolorowe piksele. Zacznij od dzisiejszego check-inu.
          </Text>
        ) : null}
      </View>

      <View className="mt-[18px] flex-row items-center gap-[5px]">
        <Text className="text-[9px] text-flow-muted">Brak danych</Text>
        {[null, 0.1, 0.3, 0.5, 0.7, 0.9].map((value, index) => (
          <View
            key={index}
            className="h-[11px] w-[11px] rounded-[3px]"
            style={{ backgroundColor: pixelColor(value) }}
          />
        ))}
        <Text className="text-[9px] text-flow-muted">Wyższa wartość</Text>
      </View>
      <Text className="mt-[11px] text-[10px] leading-[15px] text-[#728199]">
        Kolor pokazuje wartość wybranego wskaźnika; „Wszystko” uśrednia dostępne pomiary.
      </Text>
    </View>
  );
}
