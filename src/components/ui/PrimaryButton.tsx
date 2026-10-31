import { ActivityIndicator, Pressable, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function PrimaryButton({ label, onPress, disabled = false, loading = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      className={`mt-[22px] min-h-[47px] flex-row items-center justify-center rounded-[11px] bg-flow-accent px-4 ${
        disabled ? 'opacity-55' : 'active:opacity-80'
      }`}
      disabled={disabled}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color="#0A0F1E" />
      ) : (
        <Text className="text-[13px] font-bold text-flow-bg">{label}</Text>
      )}
    </Pressable>
  );
}
