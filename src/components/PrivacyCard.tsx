import { Text, View } from 'react-native';

type Props = { cloudEnabled: boolean };

export function PrivacyCard({ cloudEnabled }: Props) {
  return (
    <View className="flex-row items-start gap-[11px] rounded-[15px] border border-[#244234] bg-[#10251E] p-4">
      <View className="h-[23px] w-[23px] items-center justify-center rounded-lg bg-[#234532]">
        <Text className="text-[13px] font-bold text-flow-accent">✓</Text>
      </View>
      <View className="flex-1">
        <Text className="mb-[5px] text-[11px] font-bold text-[#DCEBDE]">
          Twoje dane są prywatne
        </Text>
        <Text className="text-[10px] leading-[15px] text-[#9CB7A4]">
          {cloudEnabled
            ? 'Wpisy są przypisane do Twojego konta i chronione regułami dostępu w bazie.'
            : 'W trybie lokalnym dane pozostają w pamięci tego urządzenia.'}
        </Text>
      </View>
    </View>
  );
}
