import { Pressable, Text, TextInput, View } from 'react-native';
import { ENERGY_LABELS, MOOD_LABELS } from '../lib/dashboard';
import type { Tracker } from '../lib/types';
import { PrimaryButton } from './ui/PrimaryButton';

type Props = {
  mood: number | null;
  energy: number | null;
  sleep: string;
  customValues: Record<string, string>;
  trackers: Tracker[];
  saving: boolean;
  onMoodChange: (value: number | null) => void;
  onEnergyChange: (value: number | null) => void;
  onSleepChange: (value: string) => void;
  onCustomValueChange: (trackerId: string, value: string) => void;
  onSave: () => void;
};

const inputClassName =
  'min-h-11 rounded-[10px] border border-flow-border bg-flow-raised px-[13px] py-2.5 text-sm text-flow-text outline-none';

function RatingScale({
  label,
  values,
  selectedValue,
  onChange,
}: {
  label: string;
  values: string[];
  selectedValue: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <>
      <Text className="mb-[9px] text-xs font-semibold text-[#D7DFEB]">{label}</Text>
      <View className="flex-row gap-[7px]">
        {values.map((caption, index) => {
          const value = index + 1;
          const selected = selectedValue === value;
          return (
            <Pressable
              key={caption}
              accessibilityLabel={`${value}: ${caption}`}
              accessibilityRole="button"
              className={`h-[61px] min-w-0 flex-1 items-center justify-center rounded-[11px] border px-[3px] ${
                selected
                  ? 'border-flow-accent bg-flow-accent-dark'
                  : 'border-flow-raised bg-flow-raised'
              }`}
              onPress={() => onChange(selected ? null : value)}
            >
              <Text
                className={`text-[17px] font-bold ${selected ? 'text-flow-accent' : 'text-[#D5DDE9]'}`}
              >
                {value}
              </Text>
              <Text
                className={`mt-1 text-[8px] ${selected ? 'text-[#D7EACB]' : 'text-flow-muted'}`}
                numberOfLines={1}
              >
                {caption}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

export function DailyCheckInCard({
  mood,
  energy,
  sleep,
  customValues,
  trackers,
  saving,
  onMoodChange,
  onEnergyChange,
  onSleepChange,
  onCustomValueChange,
  onSave,
}: Props) {
  return (
    <View className="rounded-[18px] border border-flow-border bg-flow-surface p-[22px]">
      <View className="mb-[22px] flex-row items-center justify-between gap-3">
        <View>
          <Text className="mb-[7px] text-[9px] font-bold tracking-[1.4px] text-flow-muted">
            CODZIENNY CHECK-IN
          </Text>
          <Text className="text-lg font-semibold tracking-[-0.3px] text-flow-text">
            Zapisz, co u Ciebie
          </Text>
        </View>
        <View className="h-[9px] w-[9px] rounded-full bg-flow-accent" />
      </View>

      <RatingScale
        label="Nastrój"
        onChange={onMoodChange}
        selectedValue={mood}
        values={MOOD_LABELS}
      />
      <View className="mt-5">
        <RatingScale
          label="Energia"
          onChange={onEnergyChange}
          selectedValue={energy}
          values={ENERGY_LABELS}
        />
      </View>

      <View className="mb-[9px] mt-5 flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-[#D7DFEB]">Sen</Text>
        <Text className="text-[11px] text-flow-muted">godziny</Text>
      </View>
      <TextInput
        accessibilityLabel="Liczba godzin snu"
        className={inputClassName}
        keyboardType="decimal-pad"
        onChangeText={(value) => onSleepChange(value.replace(',', '.'))}
        placeholder="np. 7,5"
        placeholderTextColor="#93A2B9"
        value={sleep}
      />

      {trackers.length > 0 ? (
        <View className="mt-[22px] gap-2.5">
          <Text className="mb-[9px] text-xs font-semibold text-[#D7DFEB]">Twoje wskaźniki</Text>
          {trackers.map((tracker) => (
            <View
              key={tracker.id}
              className="flex-row items-center justify-between gap-3 border-t border-flow-border pt-3"
            >
              <View className="flex-1">
                <Text className="mb-1 text-[13px] font-semibold text-flow-text">{tracker.name}</Text>
                <Text className="text-[11px] text-flow-muted">
                  {tracker.type === 'number'
                    ? `0–${tracker.scaleMax}${tracker.unit ? ` ${tracker.unit}` : ''}`
                    : tracker.type === 'text'
                      ? 'Odpowiedź tekstowa'
                      : 'Wybierz tak albo nie'}
                </Text>
              </View>
              {tracker.type === 'boolean' ? (
                <View className="flex-row gap-2">
                  {[
                    { value: 'true', label: 'Tak' },
                    { value: 'false', label: 'Nie' },
                  ].map((option) => {
                    const selected = customValues[tracker.id] === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        accessibilityRole="button"
                        onPress={() =>
                          onCustomValueChange(tracker.id, selected ? '' : option.value)
                        }
                        className={`min-w-[58px] items-center rounded-[9px] border px-3 py-2 ${
                          selected
                            ? 'border-flow-accent bg-flow-accent-dark'
                            : 'border-flow-border bg-flow-raised'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            selected ? 'text-flow-accent' : 'text-flow-muted'
                          }`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <TextInput
                  accessibilityLabel={tracker.name}
                  className={`min-h-10 rounded-[9px] border border-flow-border bg-flow-raised px-2 text-sm text-flow-text ${
                    tracker.type === 'number' ? 'w-[85px] text-center' : 'w-[55%]'
                  }`}
                  keyboardType={tracker.type === 'number' ? 'decimal-pad' : 'default'}
                  maxLength={tracker.type === 'text' ? 500 : undefined}
                  onChangeText={(value) =>
                    onCustomValueChange(
                      tracker.id,
                      tracker.type === 'number' ? value.replace(',', '.') : value,
                    )
                  }
                  placeholder={tracker.type === 'number' ? '—' : 'Wpisz tekst'}
                  placeholderTextColor="#93A2B9"
                  value={customValues[tracker.id] ?? ''}
                />
              )}
            </View>
          ))}
        </View>
      ) : null}

      <PrimaryButton
        disabled={saving}
        label={saving ? 'Zapisywanie…' : 'Zapisz dzisiejszy wpis'}
        loading={saving}
        onPress={onSave}
      />
    </View>
  );
}
