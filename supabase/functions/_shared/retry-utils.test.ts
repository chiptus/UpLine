import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { FakeTime } from "jsr:@std/testing@1/time";
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
    using time = new FakeTime();
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

    const resultPromise = fetchWithRetry(mockFetch, mockParse, {
      maxRetries: 1,
      initialDelayMs: 10,
    });
    await time.tickAsync(1000);
    const result = await resultPromise;

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

Deno.test(
  "fetchWithRetry respects Retry-After header in delay",
  async function fetchWithRetryRespectRetryAfter() {
    using time = new FakeTime();
    let attemptCount = 0;
    const attemptTimes: number[] = [];

    async function mockFetch() {
      attemptCount++;
      attemptTimes.push(Date.now());
      if (attemptCount === 1) {
        return new Response(null, {
          status: 429,
          headers: { "Retry-After": "2" },
        });
      }
      return new Response(JSON.stringify({ data: "success" }), {
        status: 200,
      });
    }

    async function mockParse(response: Response) {
      return response.json() as Promise<{ data: string }>;
    }

    const resultPromise = fetchWithRetry(mockFetch, mockParse, {
      maxRetries: 2,
      initialDelayMs: 100,
      maxDelayMs: 5000,
    });
    await time.tickAsync(2000);
    const result = await resultPromise;

    assertEquals(result.success, true);
    assertEquals(attemptCount, 2);
    assertEquals(attemptTimes.length, 2);

    const delayMs = attemptTimes[1] - attemptTimes[0];
    const retryAfterMs = 2000;

    assertEquals(
      delayMs >= retryAfterMs - 50,
      true,
      `Delay ${delayMs}ms should be at least Retry-After ${retryAfterMs}ms (with 50ms tolerance)`,
    );
  },
);

Deno.test(
  "fetchWithRetry caps delay at maxDelayMs even with large Retry-After",
  async function fetchWithRetryCapAtMax() {
    let _attemptCount = 0;

    function mockFetch() {
      _attemptCount++;
      return Promise.resolve(
        new Response(null, {
          status: 429,
          headers: { "Retry-After": "3600" },
        }),
      );
    }

    async function mockParse(_response: Response) {
      return { data: "should not reach here" };
    }

    const startTime = Date.now();
    const result = await fetchWithRetry(mockFetch, mockParse, {
      maxRetries: 1,
      initialDelayMs: 100,
      maxDelayMs: 200,
    });

    const elapsedMs = Date.now() - startTime;

    assertEquals(result.success, false);
    if (!result.success && result.type === "rate-limit") {
      assertEquals(result.retryAfterSeconds, 3600);
    }

    assertEquals(
      elapsedMs <= 400,
      true,
      `Total time ${elapsedMs}ms should be capped around maxDelayMs 200ms (with buffer)`,
    );
  },
);
