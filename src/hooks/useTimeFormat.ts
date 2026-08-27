import { useAuth } from "@/contexts/AuthContext";

export function useTimeFormat(): boolean {
  const { profile } = useAuth();
  return profile?.use_24_hour ?? true;
}
