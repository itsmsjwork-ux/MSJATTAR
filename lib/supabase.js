import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://xpnfzmwrcxwpxgoaqpeh.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbmZ6bXdyY3h3cHhnb2FxcGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNjc2NjYsImV4cCI6MjA5NDk0MzY2Nn0.MMkibPkw-OY_iUgKUTNli1lNXI6NEF26xTtM8Fva6ow";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
