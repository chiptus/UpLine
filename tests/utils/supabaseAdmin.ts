import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/integrations/supabase/types";
import { TEST_CONFIG } from "../config/test-env";

export const adminClient = createClient<Database>(
  TEST_CONFIG.SUPABASE_URL,
  TEST_CONFIG.SUPABASE_SERVICE_ROLE_KEY,
);
