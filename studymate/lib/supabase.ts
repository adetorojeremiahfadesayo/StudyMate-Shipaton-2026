import { createBrowserClient } from "@supabase/ssr";
import { DEMO_SESSION, DEMO_USER, IS_DEMO_MODE } from "@/lib/demo-auth";

const client = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

if (IS_DEMO_MODE) {
  client.auth.getSession = async () => {
    return { data: { session: DEMO_SESSION }, error: null };
  };

  client.auth.getUser = async () => {
    return { data: { user: DEMO_USER }, error: null };
  };

  client.auth.updateUser = async () => {
    return { data: { user: DEMO_USER }, error: null };
  };
}

export const supabase = client;
