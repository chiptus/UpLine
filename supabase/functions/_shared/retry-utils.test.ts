import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { fetchWithRetry } from "./retry-utils.ts";

Deno.test(
  "fetchWithRetry succeeds on first try",
  async function fetchWithRetryFirstTry() {
    function mockFetch() {
      return Promise.resolve(
        new Response(JSON.stringify({ data: "success" }), { status: 200 }),
      );
    }

    async function mockParse(response: Response) {
      return response.json() as Promise<{ data: string }>;
    }

    const result = await fetchWithRetry(mockFetch, mockParse);

    assertEquals(result.success, true);
    if (result.success) {
      assertEquals(result.data.data, "success");
    }
  },
);

Deno.test(
  "fetchWithRetry returns rate-limit error on 429 after retries",
  async function fetchWithRetry429Exhausted() {
    let attemptCount = 0;

    function mockFetch() {
      attemptCount++;
      return Promise.resolve(
        new Response(null, {
          status: 429,
          headers: { "Retry-After": "30" },
        }),
      );
    }

    async function mockParse(_response: Response) {
      return { data: "should not reach here" };
    }

    const result = await fetchWithRetry(mockFetch, mockParse, {
      maxRetries: 2,
      initialDelayMs: 10,
      maxDelayMs: 100,
    });

    assertEquals(result.success, false);
    if (!result.success && result.type === "rate-limit") {
      assertEquals(result.retryAfterSeconds, 30);
      assertEquals(attemptCount, 3);
    }
  },
);

Deno.test(
  "fetchWithRetry retries and succeeds on 429 then 200",
  async function fetchWithRetryRecovery() {
    let attemptCount = 0;

    async function mockFetch() {
      attemptCount++;
      if (attemptCount === 1) {
        return new Response(null, {
          status: 429,
          headers: { "Retry-After": "1" },
        });
      }
      return new Response(JSON.stringify({ data: "success" }), {
        status: 200,
      });
    }

    async function mockParse(response: Response) {
      return response.json() as Promise<{ data: string }>;
    }

    const result = await fetchWithRetry(mockFetch, mockParse, {
      maxRetries: 2,
      initialDelayMs: 10,
      maxDelayMs: 100,
    });

    assertEquals(result.success, true);
    if (result.success) {
      assertEquals(result.data.data, "success");
      assertEquals(attemptCount, 2);
    }
  },
);

Deno.test(
  "fetchWithRetry does not retry on non-429 errors",
  async function fetchWithRetryNon429() {
    let attemptCount = 0;

    function mockFetch() {
      attemptCount++;
      return Promise.resolve(
        new Response(null, {
          status: 500,
          statusText: "Internal Server Error",
        }),
      );
    }

    async function mockParse(_response: Response) {
      return { data: "should not reach here" };
    }

    const result = await fetchWithRetry(mockFetch, mockParse, {
      maxRetries: 2,
    });

    assertEquals(result.success, false);
    if (!result.success && result.type === "other") {
      assertExists(result.error);
      assertEquals(attemptCount, 1);
    }
  },
);

Deno.test(
  "fetchWithRetry parses Retry-After as numeric seconds",
  async function fetchWithRetryAfterNumeric() {
    function mockFetch() {
      return Promise.resolve(
        new Response(null, {
          status: 429,
          headers: { "Retry-After": "45" },
        }),
      );
    }

    async function mockParse(_response: Response) {
      return { data: "should not reach here" };
    }

    const result = await fetchWithRetry(mockFetch, mockParse, {
      maxRetries: 0,
    });

    assertEquals(result.success, false);
    if (!result.success && result.type === "rate-limit") {
      assertEquals(result.retryAfterSeconds, 45);
    }
  },
);

Deno.test(
  "fetchWithRetry defaults to 60 seconds when Retry-After is missing",
  async function fetchWithRetryAfterDefault() {
    function mockFetch() {
      return Promise.resolve(
        new Response(null, {
          status: 429,
        }),
      );
    }

    async function mockParse(_response: Response) {
      return { data: "should not reach here" };
    }

    const result = await fetchWithRetry(mockFetch, mockParse, {
      maxRetries: 0,
    });

    assertEquals(result.success, false);
    if (!result.success && result.type === "rate-limit") {
      assertEquals(result.retryAfterSeconds, 60);
    }
  },
);

Deno.test(
  "fetchWithRetry respects maxRetries option",
  async function fetchWithRetryMaxRetries() {
    let attemptCount = 0;

    function mockFetch() {
      attemptCount++;
      return Promise.resolve(
        new Response(null, {
          status: 429,
          headers: { "Retry-After": "1" },
        }),
      );
    }

    async function mockParse(_response: Response) {
      return { data: "should not reach here" };
    }

    const result = await fetchWithRetry(mockFetch, mockParse, {
      maxRetries: 1,
      initialDelayMs: 10,
    });

    assertEquals(result.success, false);
    assertEquals(attemptCount, 2);
  },
);

Deno.test(
  "fetchWithRetry returns other error when fetch throws",
  async function fetchWithRetryFetchThrows() {
    function mockFetch() {
      return Promise.reject(new Error("Network error"));
    }

    async function mockParse(_response: Response) {
      return { data: "should not reach here" };
    }

    const result = await fetchWithRetry(mockFetch, mockParse, {
      maxRetries: 0,
    });

    assertEquals(result.success, false);
    if (!result.success && result.type === "other") {
      assertExists(result.error);
    }
  },
);
