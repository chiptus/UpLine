export function timeoutSignal(
  signal: AbortSignal | undefined,
  timeoutMs: number = 10000,
): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}
