import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DEMO_SESSION, DEMO_USER, IS_DEMO_MODE } from "@/lib/demo-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function createSupabaseServerClient() {
  if (IS_DEMO_MODE) {
    supabaseAdmin.auth.getSession = async () => {
      return { data: { session: DEMO_SESSION }, error: null };
    };

    supabaseAdmin.auth.getUser = async () => {
      return { data: { user: DEMO_USER }, error: null };
    };

    return supabaseAdmin;
  }

  const cookieStore = await cookies();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components can read cookies but cannot reliably set them.
          }
        },
      },
      global: {
        fetch: (url, options) => {
          return fetch(url, { ...options, cache: "no-store" });
        },
      },
    },
  );

  return client;
}
