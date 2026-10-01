import type { Session, User } from "@supabase/supabase-js";

export const DEMO_USER_ID = "c2c92fa5-bb78-4875-93c9-4fc58057a7a9";
// The public /demo page is independent of this local dashboard shortcut.
// Deployed APIs always authenticate real Supabase users, including judge accounts.
export const IS_DEMO_MODE = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const MOCK_TOKEN = "studymate-demo-access-token";

export const DEMO_USER: User = {
  id: DEMO_USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: "demo@student.studymate.local",
  email_confirmed_at: new Date().toISOString(),
  phone: "",
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {
    full_name: "Demo Student",
    discipline: "law",
    education_level: "tertiary",
    study_xp: 120,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEMO_SESSION: Session = {
  access_token: MOCK_TOKEN,
  token_type: "bearer",
  expires_in: 3600,
  refresh_token: "demo-refresh-token",
  user: DEMO_USER,
};
