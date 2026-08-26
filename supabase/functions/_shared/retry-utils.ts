export interface RetryResult<T> {
  success: true;
  data: T;
}

export interface RateLimitError {
  success: false;
  type: "rate-limit";
  retryAfterSeconds: number;
}

export interface OtherError {
  success: false;
  type: "other";
  error: unknown;
}

export type RequestResult<T> = RetryResult<T> | RateLimitError | OtherError;

interface FetchOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

export async function fetchWithRetry<T>(
  fn: () => Promise<Response>,
  parseResponse: (response: Response) => Promise<T>,
  options: FetchOptions = {},
): Promise<RequestResult<T>> {
  const maxRetries = options.maxRetries ?? 2;
  const initialDelayMs = options.initialDelayMs ?? 100;
  const maxDelayMs = options.maxDelayMs ?? 32000;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fn();

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const retryAfterSeconds = parseRetryAfter(retryAfter);

          if (attempt < maxRetries) {
            const delay = Math.min(
              initialDelayMs * Math.pow(2, attempt),
              maxDelayMs,
            );
            console.log(
              `[fetchWithRetry] Received 429, retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
            );
            await sleep(delay);
            continue;
          }

          console.error(
            `[fetchWithRetry] Rate limited after ${maxRetries} retries, returning rate-limit error`,
          );
          return {
            success: false,
            type: "rate-limit",
            retryAfterSeconds,
          };
        }

        const errorText = await response
          .text()
          .catch(() => "Unable to read error response");
        console.error(
          `[fetchWithRetry] Request failed with status ${response.status}:`,
          {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          },
        );

        return {
          success: false,
          type: "other",
          error: new Error(`HTTP ${response.status}: ${response.statusText}`),
        };
      }

      const data = await parseResponse(response);
      return { success: true, data };
    } catch (error) {
      lastError = error;
      console.error(
        `[fetchWithRetry] Fetch attempt ${attempt + 1} failed:`,
        error,
      );

      if (attempt < maxRetries) {
        const delay = Math.min(
          initialDelayMs * Math.pow(2, attempt),
          maxDelayMs,
        );
        console.log(`[fetchWithRetry] Retrying after ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  return {
    success: false,
    type: "other",
    error: lastError ?? new Error("Unknown error"),
  };
}

function parseRetryAfter(retryAfterHeader: string | null): number {
  if (!retryAfterHeader) {
    return 60;
  }

  const seconds = parseInt(retryAfterHeader, 10);
  if (!isNaN(seconds) && seconds > 0) {
    return seconds;
  }

  try {
    const retryDate = new Date(retryAfterHeader);
    const now = new Date();
    const diffMs = retryDate.getTime() - now.getTime();
    if (diffMs > 0) {
      return Math.ceil(diffMs / 1000);
    }
  } catch {
    // Invalid date format, use default
  }

  return 60;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
