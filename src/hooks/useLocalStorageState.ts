import { useState } from "react";
import type { z } from "zod";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export function useLocalStorageState<Schema extends z.ZodTypeAny>(
  key: string,
  schema: Schema,
  defaultValue: z.infer<Schema> | (() => z.infer<Schema>),
  storage: StorageLike = localStorage,
) {
  type Value = z.infer<Schema>;

  const [value, setValue] = useState<Value>(() => readValue());

  function readValue(): Value {
    try {
      const raw = storage.getItem(key);
      if (raw) {
        const result = schema.safeParse(JSON.parse(raw));
        if (result.success) {
          return result.data;
        }
      }
    } catch (error) {
      console.error(
        `[useLocalStorageState] Failed to read "${key}", falling back to default:`,
        error,
      );
    }
    return typeof defaultValue === "function"
      ? (defaultValue as () => Value)()
      : defaultValue;
  }

  function updateValue(newValue: Value) {
    setValue(newValue);
    try {
      if ((newValue === null || newValue === undefined) && storage.removeItem) {
        storage.removeItem(key);
      } else {
        storage.setItem(key, JSON.stringify(newValue));
      }
    } catch (error) {
      console.error(
        `[useLocalStorageState] Failed to persist "${key}"; state still updates in memory:`,
        error,
      );
    }
  }

  return [value, updateValue] as const;
}
