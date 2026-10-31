import { Pressable, Text, TextInput, View } from 'react-native';
import { Brand } from './ui/Brand';
import { Notice } from './ui/Notice';
import { PrimaryButton } from './ui/PrimaryButton';

export type AuthMode = 'signin' | 'signup';

type Props = {
  mode: AuthMode;
  setupIncomplete?: boolean;
  email: string;
  password: string;
  busy: boolean;
  errorMessage: string;
  successMessage: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: () => void;
  onModeChange: (mode: AuthMode) => void;
};

const inputClassName =
  'min-h-11 rounded-[10px] border border-flow-border bg-flow-raised px-[13px] py-2.5 text-sm text-flow-text outline-none';

export function AuthScreen({
  mode,
  setupIncomplete = false,
  email,
  password,
  busy,
  errorMessage,
  successMessage,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onModeChange,
}: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-flow-bg p-[22px]">
      <View className="w-full max-w-[430px] rounded-[20px] border border-flow-border bg-flow-surface p-7">
        <Brand />
        <Text className="mb-2 mt-8 text-[28px] font-bold tracking-tight text-flow-text">
          {setupIncomplete
            ? 'Dokończ konfigurację'
            : mode === 'signin'
              ? 'Zadbaj o swój rytm.'
              : 'Zacznij swój rytm.'}
        </Text>
        <Text className="mb-6 mt-2.5 text-[13px] leading-5 text-flow-muted">
          {setupIncomplete
            ? 'Znaleziono tylko jedną zmienną Supabase. Uzupełnij w pliku .env zarówno EXPO_PUBLIC_SUPABASE_URL, jak i EXPO_PUBLIC_SUPABASE_ANON_KEY, a następnie uruchom Expo ponownie.'
            : 'Zaloguj się, żeby bezpiecznie zapisywać swoje dane i mieć do nich dostęp na każdym urządzeniu.'}
        </Text>

        {!setupIncomplete ? (
          <>
            <Text className="mb-[9px] text-xs font-semibold text-[#D7DFEB]">Adres e-mail</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              className={inputClassName}
              keyboardType="email-address"
              onChangeText={onEmailChange}
              placeholder="ty@przyklad.pl"
              placeholderTextColor="#93A2B9"
              value={email}
            />
            <Text className="mb-[9px] mt-4 text-xs font-semibold text-[#D7DFEB]">Hasło</Text>
            <TextInput
              autoCapitalize="none"
              className={inputClassName}
              onChangeText={onPasswordChange}
              onSubmitEditing={onSubmit}
              placeholder="Co najmniej 6 znaków"
              placeholderTextColor="#93A2B9"
              secureTextEntry
              value={password}
            />
            {errorMessage ? <Notice message={errorMessage} tone="error" /> : null}
            {successMessage ? <Notice message={successMessage} tone="success" /> : null}
            <PrimaryButton
              disabled={busy || !email.trim() || password.length < 6}
              label={mode === 'signin' ? 'Zaloguj się' : 'Utwórz konto'}
              loading={busy}
              onPress={onSubmit}
            />
            <Pressable
              className="items-center pt-[18px]"
              onPress={() => onModeChange(mode === 'signin' ? 'signup' : 'signin')}
            >
              <Text className="text-xs text-flow-muted">
                {mode === 'signin' ? 'Nie masz konta? ' : 'Masz już konto? '}
                <Text className="font-bold text-flow-accent">
                  {mode === 'signin' ? 'Zarejestruj się' : 'Zaloguj się'}
                </Text>
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}
