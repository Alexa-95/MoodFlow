import { Text, View } from 'react-native';

export function Brand() {
  return (
    <View className="flex-row items-center gap-2.5">
      <View className="h-7 w-7 flex-row flex-wrap gap-1">
        <View className="h-3 w-3 rounded bg-flow-accent" />
        <View className="h-3 w-3 rounded bg-flow-teal" />
        <View className="h-3 w-3 rounded bg-flow-green" />
        <View className="h-3 w-3 rounded bg-flow-accent-dark" />
      </View>
      <Text className="text-[21px] font-bold tracking-tight text-flow-text">
        mood<Text className="text-flow-accent">flow</Text>
      </Text>
    </View>
  );
}
