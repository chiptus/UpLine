export interface ImportResult {
  success: boolean;
  message: string;
  inserted?: number;
  updated?: number;
  errors?: string[];
}
