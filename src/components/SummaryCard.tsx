import { Text, View } from 'react-native';
import { formatAverage } from '../lib/dashboard';
import type { Period } from '../lib/types';
import { PERIOD_DAYS } from '../lib/types';
import { SummaryRow } from './ui/SummaryRow';

type Props = {
  period: Period;
  moodValues: number[];
  energyValues: number[];
  sleepValues: number[];
};

export function SummaryCard({ period, moodValues, energyValues, sleepValues }: Props) {
  return (
    <View className="rounded-[18px] border border-flow-border bg-flow-surface p-[22px]">
      <Text className="mb-[7px] text-[9px] font-bold tracking-[1.4px] text-flow-muted">
        W OSTATNICH {PERIOD_DAYS[period]} DNIACH
      </Text>
      <Text className="text-lg font-semibold tracking-[-0.3px] text-flow-text">
        Małe podsumowanie
      </Text>
      <View className="mt-[23px] gap-[18px]">
        <SummaryRow
          color="#9DDD77"
          label="Średni nastrój"
          suffix=" (-5 do 5)"
          value={formatAverage(moodValues)}
        />
        <SummaryRow
          color="#52C8B2"
          label="Średnia energia"
          suffix="/ 10"
          value={formatAverage(energyValues)}
        />
        <SummaryRow
          color="#F5B968"
          label="Średni sen"
          suffix=" godz."
          value={formatAverage(sleepValues)}
        />
      </View>
    </View>
  );
}
