import { Pressable, Text, View } from 'react-native';

type Props = {
  message: string;
  tone: 'error' | 'success';
  onClose?: () => void;
};

export function Notice({ message, tone, onClose }: Props) {
  return (
    <View
      className={`mb-4 flex-row items-center justify-between gap-3 rounded-xl border p-3 ${
        tone === 'error'
          ? 'border-[#693140] bg-[#3A1D29]'
          : 'border-[#315840] bg-[#183627]'
      }`}
    >
      <Text className="flex-1 text-xs leading-[18px] text-[#F1DDE1]">{message}</Text>
      {onClose ? (
        <Pressable accessibilityLabel="Zamknij komunikat" onPress={onClose}>
          <Text className="text-[21px] text-flow-text">×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
