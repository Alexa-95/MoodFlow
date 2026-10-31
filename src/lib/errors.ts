export function describeError(error: unknown, fallback: string): string {
  if (error instanceof Error) return `${fallback} ${error.message}`;

  if (typeof error !== 'object' || error === null) return fallback;

  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';
  if (!message) return fallback;

  const code = 'code' in error && typeof error.code === 'string' ? ` (${error.code})` : '';
  const hint = 'hint' in error && typeof error.hint === 'string' ? ` Wskazówka: ${error.hint}` : '';
  return `${fallback} ${message}${code}.${hint}`;
}
