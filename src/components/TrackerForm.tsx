import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import type { Tracker } from '../lib/types';
import { Notice } from './ui/Notice';

type Props = {
  trackers: Tracker[];
  onAdd: (name: string, unit: string, scaleMax: number) => Promise<void>;
};

const inputClassName =
  'min-h-11 rounded-[10px] border border-flow-border bg-flow-raised px-[13px] py-2.5 text-sm text-flow-text outline-none';

export function TrackerForm({ trackers, onAdd }: Props) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [scale, setScale] = useState('5');
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function submit(): Promise<void> {
    const trimmedName = name.trim();
    const scaleMax = Number(scale);
    if (!trimmedName || trimmedName.length > 40) {
      setErrorMessage('Podaj nazwę wskaźnika (maksymalnie 40 znaków).');
      return;
    }
    if (!Number.isFinite(scaleMax) || scaleMax <= 0 || scaleMax > 10000) {
      setErrorMessage('Maksymalna wartość skali musi być większa od 0 i nie większa niż 10 000.');
      return;
    }

    setBusy(true);
    setErrorMessage('');
    try {
      await onAdd(trimmedName, unit.trim(), scaleMax);
      setName('');
      setUnit('');
      setScale('5');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nie udało się dodać wskaźnika.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="rounded-[18px] border border-flow-border bg-flow-surface p-[22px]">
      <Text className="mb-[7px] text-[9px] font-bold tracking-[1.4px] text-flow-muted">
        DOPASUJ DO SIEBIE
      </Text>
      <Text className="text-lg font-semibold tracking-[-0.3px] text-flow-text">
        Dodaj wskaźnik
      </Text>
      <Text className="mb-[18px] mt-[9px] text-[11px] leading-[17px] text-flow-muted">
        Co jeszcze chcesz obserwować? Np. spacer, wodę, stres albo czas offline.
      </Text>
      <Text className="mb-[9px] text-xs font-semibold text-[#D7DFEB]">Nazwa</Text>
      <TextInput
        className={inputClassName}
        maxLength={40}
        onChangeText={setName}
        placeholder="np. Woda"
        placeholderTextColor="#93A2B9"
        value={name}
      />
      <View className="flex-row gap-2.5">
        <View className="flex-1">
          <Text className="mb-[9px] mt-4 text-xs font-semibold text-[#D7DFEB]">Jednostka</Text>
          <TextInput
            className={inputClassName}
            maxLength={12}
            onChangeText={setUnit}
            placeholder="np. szkl."
            placeholderTextColor="#93A2B9"
            value={unit}
          />
        </View>
        <View className="w-[84px]">
          <Text className="mb-[9px] mt-4 text-xs font-semibold text-[#D7DFEB]">Skala do</Text>
          <TextInput
            className={inputClassName}
            keyboardType="decimal-pad"
            onChangeText={(value) => setScale(value.replace(',', '.'))}
            placeholder="5"
            placeholderTextColor="#93A2B9"
            value={scale}
          />
        </View>
      </View>
      <Pressable
        className={`mt-4 min-h-[43px] flex-row items-center justify-center rounded-[10px] border border-[#46683D] bg-flow-accent-dark px-2.5 ${
          busy || !name.trim() ? 'opacity-55' : 'active:opacity-80'
        }`}
        disabled={busy || !name.trim()}
        onPress={submit}
      >
        {busy ? (
          <ActivityIndicator color="#A8F27A" />
        ) : (
          <Text className="text-[11px] font-bold text-flow-accent">
            ＋ Dodaj do moich wskaźników
          </Text>
        )}
      </Pressable>
      {errorMessage ? (
        <View className="mt-3">
          <Notice message={errorMessage} tone="error" onClose={() => setErrorMessage('')} />
        </View>
      ) : null}
      {trackers.length ? (
        <View className="mt-3.5 flex-row flex-wrap gap-[7px]">
          {trackers.map((tracker) => (
            <View
              key={tracker.id}
              className="flex-row items-center gap-[6px] rounded-full bg-flow-raised px-[9px] py-1.5"
            >
              <View className="h-1.5 w-1.5 rounded-full bg-flow-teal" />
              <Text className="text-[10px] text-[#D9E1EC]">{tracker.name}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
