import { Pressable, Text, View } from 'react-native';
import { Brand } from './ui/Brand';

type Props = {
  narrowLayout: boolean;
  cloudEnabled: boolean;
  email?: string;
  onSignOut: () => void;
};

export function DashboardHeader({ narrowLayout, cloudEnabled, email, onSignOut }: Props) {
  return (
    <>
      <View className="mb-7 min-h-[82px] flex-row items-center justify-between border-b border-[#182236]">
        <Brand />
        <View className="max-w-[60%] flex-row items-center gap-3">
          {cloudEnabled ? (
            <>
              <Text className="max-w-[190px] text-[13px] text-flow-muted" numberOfLines={1}>
                {email}
              </Text>
              <Pressable
                className="rounded-[10px] border border-flow-border px-3 py-2 active:opacity-80"
                onPress={onSignOut}
              >
                <Text className="text-xs font-semibold text-flow-text">Wyloguj</Text>
              </Pressable>
            </>
          ) : (
            <View className="flex-row items-center gap-[7px] rounded-full bg-[#172635] px-3 py-2">
              <View className="h-[7px] w-[7px] rounded-full bg-flow-amber" />
              <Text className="text-xs font-semibold text-[#D6E4F2]">Tryb lokalny</Text>
            </View>
          )}
        </View>
      </View>

      {!cloudEnabled ? (
        <View className="mb-[26px] rounded-xl border border-[#304455] bg-[#172635] p-3.5">
          <Text className="text-[13px] leading-5 text-[#C8D8E4]">
            Podgląd bez chmury — dane są zapisane tylko w tej przeglądarce lub na tym urządzeniu.
            Skonfiguruj Supabase, aby włączyć konta i synchronizację.
          </Text>
        </View>
      ) : null}

      <View
        className={`mb-7 flex-row items-end justify-between gap-5 ${
          narrowLayout ? 'flex-col items-start' : ''
        }`}
      >
        <View className="flex-1">
          <Text className="mb-2.5 text-[10px] font-bold tracking-[1.8px] text-flow-accent">
            TWOJA PRZESTRZEŃ DOBROSTANU
          </Text>
          <Text
            className={`text-[38px] font-bold tracking-[-1.5px] text-flow-text ${
              narrowLayout ? 'text-[31px]' : ''
            }`}
          >
            Jak się dziś masz?
          </Text>
          <Text className="mt-2 text-sm leading-[21px] text-flow-muted">
            Małe obserwacje pomagają zobaczyć większy obraz.
          </Text>
        </View>
        <View className="mb-[3px] rounded-[14px] border border-flow-border bg-flow-surface px-4 py-3">
          <Text className="text-[9px] font-bold tracking-[1.5px] text-flow-accent">DZISIAJ</Text>
          <Text className="mt-[5px] text-sm font-semibold text-flow-text">
            {new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
          </Text>
        </View>
      </View>
    </>
  );
}
