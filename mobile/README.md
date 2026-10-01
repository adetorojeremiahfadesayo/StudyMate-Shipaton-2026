# StudyMate Android client

This client uses the existing StudyMate backend. It does not contain server secrets or AI models.

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the same public values used by the web app.
3. Set `VITE_API_BASE_URL` to the reachable HTTPS origin of the StudyMate Next.js backend. Use a LAN/tunnel/deployed origin that the Android device can reach; `localhost` on a phone means the phone.
4. Set `VITE_REVENUECAT_PUBLIC_SDK_KEY` to the RevenueCat Android/Test Store **public SDK key**.
5. On the **backend only**, set `REVENUECAT_SECRET_API_KEY` for server entitlement verification, plus the existing Supabase and AI server variables.
6. Run `npm install`, `npm run build`, `npx cap add android` (once), and `npm run android:sync`. Open with `npm run android:open` and build in Android Studio.

The app ID is `com.studymate.mobile`; register that exact ID in the relevant Android/RevenueCat configuration. A native build and Test Store purchase are required to validate billing. The browser preview intentionally reports native purchases as unavailable.

Current scope: sign in, courses, upload, explanation, practice self-check, course report PDF download/share, purchase/restore, and server-gated five-question sets. The PDF uses data already stored on the backend. Self-check answers are not persisted yet, and secure server-side quiz grading is pending. See `../docs/implementation-status.md` for the current evidence and blockers.
