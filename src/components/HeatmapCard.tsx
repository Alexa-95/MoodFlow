import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { dateOffset, localDateKey, PERIODS, metricValue, pixelColor } from '../lib/dashboard';
import type { DailyEntry, Period, Tracker } from '../lib/types';
import type { MetricKey } from '../lib/dashboard';

type Props = {
  period: Period;
  metric: MetricKey;
  entries: DailyEntry[];
  trackers: Tracker[];
  today: string;
  selectedDate: string;
  completedDays: number;
  loading: boolean;
  onPeriodChange: (period: Period) => void;
  onMetricChange: (metric: MetricKey) => void;
  onDateChange: (date: string) => void;
};

const METRICS = [
  { key: 'all', label: 'Wszystko' },
  { key: 'mood', label: 'Nastrój' },
  { key: 'energy', label: 'Energia' },
  { key: 'sleep', label: 'Sen' },
];

const WEEKDAYS = ['Pon', 'Wt', 'Śr', 'Cz', 'Pt', 'Sob', 'Nd'];

function getIsoWeekNumber(date: Date): number {
  const thursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = thursday.getUTCDay() || 7;
  thursday.setUTCDate(thursday.getUTCDate() + 4 - day);

  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const firstDay = firstThursday.getUTCDay() || 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 4 - firstDay);

  return 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export function HeatmapCard({
  period,
  metric,
  entries,
  trackers,
  today,
  selectedDate,
  completedDays,
  loading,
  onPeriodChange,
  onMetricChange,
  onDateChange,
}: Props) {
  const selectedDateValue = new Date(`${selectedDate}T00:00:00`);
  const monthTitle = selectedDateValue.toLocaleDateString('pl-PL', {
    month: 'long',
    year: 'numeric',
  });
  function changeMonth(offset: number): void {
    const nextMonth = new Date(
      selectedDateValue.getFullYear(),
      selectedDateValue.getMonth() + offset,
      1,
    );
    nextMonth.setDate(
      Math.min(
        selectedDateValue.getDate(),
        new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate(),
      ),
    );
    let nextDate = localDateKey(nextMonth);
    if (nextDate > today) nextDate = today;
    onDateChange(nextDate);
  }

  const startOfWeek = (date: Date) => dateOffset(date, -((date.getDay() + 6) % 7));
  let calendarDates: (Date | null)[];
  if (period === 'day') {
    const row = Array<Date | null>(7).fill(null);
    row[(selectedDateValue.getDay() + 6) % 7] = selectedDateValue;
    calendarDates = row;
  } else if (period === 'week') {
    const weekStart = startOfWeek(selectedDateValue);
    calendarDates = Array.from({ length: 7 }, (_, index) => dateOffset(weekStart, index));
  } else if (period === 'quarter') {
    const quarterStart = dateOffset(selectedDateValue, -89);
    const gridStart = startOfWeek(quarterStart);
    const leadingDays = (quarterStart.getDay() + 6) % 7;
    const dates: (Date | null)[] = [
      ...Array<Date | null>(leadingDays).fill(null),
      ...Array.from({ length: 90 }, (_, index) => dateOffset(quarterStart, index)),
    ];
    while (dates.length % 7 !== 0) dates.push(null);
    calendarDates = dates;
  } else {
    const monthStart = new Date(
      selectedDateValue.getFullYear(),
      selectedDateValue.getMonth(),
      1,
    );
    const gridStart = startOfWeek(monthStart);
    calendarDates = Array.from({ length: 42 }, (_, index) => dateOffset(gridStart, index));
  }
  const calendarWeeks = Array.from({ length: calendarDates.length / 7 }, (_, weekIndex) =>
    calendarDates.slice(weekIndex * 7, weekIndex * 7 + 7),
  );

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

      <View className="mb-[12px] flex-row items-center justify-between">
        <Pressable
          accessibilityLabel="Poprzedni miesiąc"
          accessibilityRole="button"
          className="rounded-[9px] border border-flow-border bg-flow-raised px-3 py-2 active:opacity-80"
          onPress={() => changeMonth(-1)}
        >
          <Text className="text-xs font-semibold text-flow-text">←</Text>
        </Pressable>
        <Text className="text-sm font-semibold capitalize text-flow-text">{monthTitle}</Text>
        <Pressable
          accessibilityLabel="Następny miesiąc"
          accessibilityRole="button"
          className={`rounded-[9px] border border-flow-border bg-flow-raised px-3 py-2 ${
            selectedDate.slice(0, 7) >= today.slice(0, 7) ? 'opacity-40' : 'active:opacity-80'
          }`}
          disabled={selectedDate.slice(0, 7) >= today.slice(0, 7)}
          onPress={() => changeMonth(1)}
        >
          <Text className="text-xs font-semibold text-flow-text">→</Text>
        </Pressable>
      </View>

      <View className="min-h-[108px] w-full justify-center">
        {loading ? (
          <View className="flex-row items-center gap-2.5 py-6">
            <ActivityIndicator color="#A8F27A" />
            <Text className="text-xs text-flow-muted">Ładowanie wpisów…</Text>
          </View>
        ) : (
          <View className="w-full">
            <View className="mb-[5px] flex-row items-center gap-[5px]">
              <Text className="w-[25px] text-center text-[8px] font-semibold text-flow-muted">
                Tydz.
              </Text>
              {WEEKDAYS.map((day) => (
                <Text
                  key={day}
                  className="flex-1 text-center text-[9px] font-semibold text-flow-muted"
                >
                  {day}
                </Text>
              ))}
            </View>
            {calendarWeeks.map((week, weekIndex) => (
              <View
                key={`${period}-${week.map((date) => (date ? localDateKey(date) : 'blank')).join('-')}`}
                className="mb-[5px] flex-row items-center gap-[5px]"
              >
                <Text className="w-[25px] text-center text-[9px] text-flow-muted">
                  {getIsoWeekNumber(week.find((date) => date !== null) ?? selectedDateValue)}
                </Text>
                {week.map((date, dayIndex) => {
                  if (date === null) {
                    return <View key={`blank-${weekIndex}-${dayIndex}`} className="flex-1" />;
                  }
                  const dateKey = localDateKey(date);
                  const entry = entries.find((item) => item.entryDate === dateKey);
                  const value = entry ? metricValue(entry, metric, trackers) : null;
                  const isOutsideMonth =
                    period === 'month' &&
                    (date.getMonth() !== selectedDateValue.getMonth() ||
                      date.getFullYear() !== selectedDateValue.getFullYear());
                  const isSelected = dateKey === selectedDate;
                  const isToday = dateKey === today;
                  const isFuture = dateKey > today;

                  return (
                    <Pressable
                      key={dateKey}
                      accessibilityLabel={`${dateKey}: ${
                        value === null ? 'brak wpisu' : `${Math.round(value * 100)}%`
                      }`}
                      accessibilityRole="button"
                      className={`flex-1 items-center justify-center rounded-[6px] border ${
                        isSelected
                          ? 'border-flow-accent'
                          : isToday
                            ? 'border-flow-text'
                            : 'border-transparent'
                      } ${isOutsideMonth ? 'opacity-35' : ''} ${isFuture ? 'opacity-20' : ''}`}
                      disabled={isFuture}
                      onPress={() => onDateChange(dateKey)}
                      style={{ aspectRatio: 1, backgroundColor: pixelColor(value) }}
                    >
                      <Text className="text-[10px] font-semibold text-flow-text">
                        {date.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
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
