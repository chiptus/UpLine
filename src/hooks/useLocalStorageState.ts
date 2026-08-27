import { useState } from "react";
import type { z } from "zod";

export function useLocalStorageState<Schema extends z.ZodTypeAny>(
  key: string,
  schema: Schema,
  defaultValue: z.infer<Schema> | (() => z.infer<Schema>),
) {
  type Value = z.infer<Schema>;

  const [value, setValue] = useState<Value>(() => readValue());

  function readValue(): Value {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const result = schema.safeParse(JSON.parse(raw));
        if (result.success) {
          return result.data;
        }
      } catch {
        // Malformed JSON, fall back to default
      }
    }
    return typeof defaultValue === "function"
      ? (defaultValue as () => Value)()
      : defaultValue;
  }

  function updateValue(newValue: Value) {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  }

  return [value, updateValue] as const;
}
