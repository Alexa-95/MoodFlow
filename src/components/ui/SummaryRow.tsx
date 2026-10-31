import { Text, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  suffix: string;
  color: string;
};

export function SummaryRow({ label, value, suffix, color }: Props) {
  return (
    <View className="flex-row items-center gap-[9px]">
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="flex-1 text-[11px] text-flow-muted">{label}</Text>
      <Text className="text-base font-bold text-flow-text">
        {value}
        {value === '—' ? '' : <Text className="text-[10px] font-normal text-flow-muted">{suffix}</Text>}
      </Text>
    </View>
  );
}
