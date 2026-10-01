# StudyMate backend and RevenueCat setup

Status (October 1): the existing Railway service has been updated and its authentication/API smoke checks passed. Ignored `mobile/.env` now uses its public Supabase configuration and the existing API origin. Android purchases and live AI generation remain unverified.

## 1. Use the existing StudyMate backend

`studymate/` is already a Next.js API and website. The Android client in `mobile/` calls that API; it does not need a second server. If the website already has working signed-in courses, material processing, and live Azure responses, use that same Supabase project and backend deployment.

The deployed origin is `https://studymate-pro.up.railway.app/`. Deployment `906a94f0-7baf-44b8-bae6-ca32af8c2dce` updated that same service, with no new backend or database. `/`, `/demo`, `/login` and `/api/health` returned HTTP 200. Requests without authentication or with an invalid bearer token returned HTTP 401. An authorized test session could read the judge account's 18 owned courses; its password and course data were preserved. No readable wiki pages were found for that account, so these checks do not establish live AI generation or upload processing.

For local work, copy `studymate/.env.example` to `studymate/.env.local`. Set the existing website's Supabase URL and public anon key, its **server-only** Supabase service key, Azure OpenAI endpoint/key/deployment, and `NEXT_PUBLIC_DEMO_MODE=false`. Add `REVENUECAT_SECRET_API_KEY` later in step 3. Optional Foundry IQ and Document Intelligence settings are needed only for their corresponding paths. The Supabase database must have the website's existing tables and this repository's migrations, and Storage must have the `materials` bucket. This repository's migrations add to an existing schema; they are not a complete fresh-database bootstrap.

Run from `studymate/`: `npm ci`, then `npm run dev -- --hostname 0.0.0.0`. For a physical phone, use a reachable HTTPS deployment/tunnel as the API origin; a phone's `localhost` does not point at your computer. A hosted Next.js deployment must have the same server environment variables. The current upload route starts material processing after returning its HTTP response; confirm the job finishes on the selected host before relying on a serverless deployment.

Copy `mobile/.env.example` to `mobile/.env`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the **same public** Supabase values as the website, and set `VITE_API_BASE_URL` to the backend origin (no `/api` suffix). Never put the Supabase service key, Azure key or RevenueCat secret key in a `VITE_` variable.

## 2. Create the Test Store subscription

In the RevenueCat dashboard, create/open the StudyMate project. Under **Apps and providers**, use the Test Store (create one under Test configuration if absent) and copy its `test_` public SDK key. Under **Product catalog → Products**, create one **Test Store** monthly subscription, with a descriptive ID such as `studymate_pro_monthly_test_v1` and a provisional test price. Test Store price and duration cannot be edited after creation; make a new product if these change.

Under **Product catalog → Entitlements**, create identifier **`studymate_pro`** and attach the monthly product. Under **Product catalog → Offerings**, create or open the default offering, add a **monthly** package and attach that product. Mark the offering as default if it is not already. The mobile code fetches the current offering's first available package and displays the package's localized `priceString`. Keep just this one package until the UI explicitly supports a choice of plans.

Put the `test_` public SDK key in `mobile/.env` as `VITE_REVENUECAT_PUBLIC_SDK_KEY`. It is for an Android **debug** build only. RevenueCat intentionally crashes a release build that uses this key. A future Google Play release requires real Play products and the Android public SDK key.

## 3. Configure server verification

In RevenueCat **Project Settings → API keys**, obtain a **secret API key with REST API v1 access** for this project. Put it only in `studymate/.env.local` (and the backend host's secret environment settings) as `REVENUECAT_SECRET_API_KEY`. Do not confuse it with the Test Store public SDK key, an Android public key, or a REST API v2 secret. `studymate/lib/revenuecat-access.ts` uses REST v1 `GET /subscribers/{app_user_id}` and checks the active `studymate_pro` entitlement.

The app supplies the signed-in Supabase user UUID to RevenueCat as its App User ID. Use the same account for sign-in, purchase, and server verification. The backend denies Pro if the RevenueCat key is missing or the lookup fails. `/api/billing/access` reports `unknown` in that situation and the mobile client skips ads. Railway currently lacks this secret key, and the mobile public SDK key is still blank.

## Free-tier ads

The Android client includes the AdMob plugin with Google test app/ad-unit IDs. With `VITE_ADS_ENABLED=true`, an ad is eligible after every second completed practice set, with at least ten minutes between displays. It checks server billing access before loading and again before display. Paid Pro and `studymate_school` entitlements, unknown billing state, denied consent, navigation away and SDK errors skip the ad. The app exposes an Ad privacy button for the native consent form.

The six ad-policy tests pass, and Capacitor sync detects the plugin. Actual native consent, ad display/dismissal and purchase-based suppression still need device testing. No production ad revenue is configured. Production requires the publisher's AdMob app ID, ad-unit ID and consent-message setup; the present implementation deliberately uses test IDs. Schools seat allocation is still a future feature.

## 4. Verify end to end

1. Start the backend with demo mode off. Sign in to the mobile client using the same Supabase account as the website. Create a course. Confirm it appears in the database and website.
2. Upload a small text PDF or `.txt` file. Wait for processing, then get a **live** explanation. If processing remains queued, investigate the job worker/host before demonstrating the feature.
3. In an Android debug build, open Pro. Confirm a monthly package and formatted price appear. Purchase through the Test Store success dialog.
4. Confirm RevenueCat CustomerInfo shows `studymate_pro`, then request five questions. Confirm a non-paying second account gets HTTP 403 for five questions while three questions still work. Test restore, failed purchase, cancellation, account switching, and entitlement expiry.
5. Test a real store sandbox separately before public store release. Test Store transactions are sandbox data, not revenue.

## Current pricing and product boundary

No monetary price is hardcoded or configured in the repository. Today the enforced paid difference is **three questions per free set versus five per Pro set**. The accepted Free/Pro/Schools pricing and monthly allowances are recorded in `docs/pricing-proposal.md`; their quotas are not implemented. The app does not yet persist answers from its self-check into the revision PDF. Do not advertise proposed limits as live benefits.

The target audience is both Nigerian and international university students. A single monthly subscription can use Google Play regional prices when real Play billing is configured; the Test Store's provisional price only exercises the purchase flow. Decide a Nigerian price and an international price after measuring the cost of a typical upload, explanation and practice session. Record the proposed paid allowance and gross margin before activating a real product. Google Play supports per-country base-plan pricing; RevenueCat returns the buyer's localized product price to the SDK.

Official references: [RevenueCat product setup](https://www.revenuecat.com/docs/projects/configuring-products), [Test Store](https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store), [REST API v1](https://www.revenuecat.com/docs/api-v1), [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).
