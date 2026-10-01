# Quotas, credits and school pilot

Approved testing defaults, October 1, 2026. These are test limits and prices; store release, regional pricing and a paid school contract are separate launch work.

| Access | Active course cap | Calendar-month sessions | Ads |
|---|---:|---:|---|
| Free | 1 | 3 | Native test ads at reviewed practice breaks |
| Pro | 5 | 30 | None with verified access |
| Active school member | 5 | 30 per person, from a 300-session school pool | None |
| 10-session top-up | No extra slots | 10 additional sessions after the monthly allowance | Free ad policy remains |

Pro Test Store price: USD 5.99/month. Consumable test price: USD 1.99 for ten sessions. Schools start with an approved owner, 25 seats and a 30-day pilot. A quote is required afterwards; no school payment or unlimited license is created by the client. Existing courses above a new cap are retained and readable. Archive a course to release a slot; reactivation is also capped.

## What a session covers

One course/topic, one material-preparation operation, Plain and Story explanations, a practice set, server-graded feedback, one targeted three-question retry with feedback, and saved revision output. Additional legacy generation tools have one fixed operation slot each. Calendar periods use UTC. Saved work, cached responses and PDF exports do not use a new allowance. A successful first operation consumes the session; subsequent failures retain its already consumed allowance. A failed first generation releases it. Unstarted reservations expire after 15 minutes and are released on the next reservation attempt. Successful sessions can continue for 24 hours, within their original calendar month; cached work remains readable afterwards.

The client displays the server allowance and saves drafts/session IDs per signed-in user. Session creation has a stable request key. Database locks serialize course caps, monthly allowances, school pools and credit debits. Operation leases fence late completions and bind a saved result to the original input. Changing a completed operation's input requires another session.

## Credit verification

`/api/billing/webhook` requires the exact configured Authorization header, validates the approved app/product, uses Supabase UUIDs as RevenueCat App User IDs, and restricts sandbox access to the backend allowlist. The product is `studymate_sessions_10_test_v1`; offering `session_topups` uses custom package `credits_10`. It is a consumable with **no Pro entitlement**. The default subscription offering remains separate.

Only authenticated webhook processing can grant purchase credits. SDK callbacks and client plan flags cannot grant credits. Event IDs and store/environment/transaction identities prevent duplicate grants and alias collisions. Supported purchase refunds reverse the original units, including creating a balance debt if some units were spent. A refund received before its purchase is recorded as a tombstone and cannot later mint credits. Buying a top-up does not remove ads or increase course slots. Restoring a consumable balance means signing back into the same StudyMate account and reading its server ledger; the SDK restore button checks subscription access.

Configure backend-only `REVENUECAT_WEBHOOK_AUTH`, `REVENUECAT_ALLOWED_APP_IDS`, `REVENUECAT_CREDIT_PRODUCT_IDS`, `REVENUECAT_SANDBOX_USER_IDS` and the existing REST v1 secret. Configure the same Authorization value on the RevenueCat webhook, with the URL `https://studymate-pro.up.railway.app/api/billing/webhook`. Never put these secrets in `VITE_` variables. Production app IDs/products must be approved explicitly before real billing.

References: [RevenueCat webhook authorization and retries](https://www.revenuecat.com/docs/integrations/webhooks), [event fields](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields), [consumables](https://www.revenuecat.com/docs/platform-resources/non-subscriptions).

## Schools

An approved owner can claim one lifetime pilot through `STUDYMATE_SCHOOL_PILOT_USER_IDS`. Admins manage seats and classes; teachers manage their assigned classes. Students join with a seven-day invite bound to their confirmed email, then use their own course material for assigned study. Invite codes must be shared manually; this implementation does not send email. A fresh invite is required to reactivate a removed seat.

Assignments specify a topic and 1–120 active minutes. The visible timer must be running before new assigned-session AI work. Heartbeats use server time, increasing sequence numbers and a maximum 45-second increment. Duplicate/out-of-order events do not add time. Backgrounding, leaving the assignment or inactivity pauses tracking; manual pauses require a reason. Completion requires the time target and persisted practice feedback. Time measures app activity, not attention or reading comprehension; no keystroke contents or background phone activity are collected.

Teacher dashboards contain only their classes and assigned activity. Student dashboards contain only their own activity. Reports share active minutes, assignment status, pause reasons and aggregate practice scores; personal course documents and private answers are not queried for these dashboards. Users can export visible records or delete their own school tracking; an owner can delete the school with exact-name confirmation. Activity older than 90 days is removed when its dashboard loads. A scheduled retention sweep is not configured.

## Verification and migration

Apply `studymate/supabase/migrations/20261001_usage_credits_schools.sql` after the existing legacy quiz migrations, then enable `STUDYMATE_METERING_ENABLED=true`. Commercial and school tables have RLS, no anon/authenticated table privileges, and trusted RPCs callable only by the server service role. Verified attempts cannot be inserted/modified by authenticated students. The course trigger also protects direct database writes.

Backend checks:

```text
node node_modules/vitest/vitest.mjs run --maxWorkers=1 --pool=forks
npm run lint
npm run build
node scripts/verify-commerce.mjs --live
node scripts/verify-study-loop.mjs
node scripts/verify-mobile-browser.mjs
```

The integration scripts require trusted backend environment configuration, create synthetic accounts only and remove their test users/courses/storage. `verify-commerce.mjs` checks quotas, duplicate credits/refunds, ownership, privileges, seats, pools, timer boundaries, class isolation and persisted grading. `verify-study-loop.mjs` performs real AI calls and checks the whole loop consumes one unit. `verify-mobile-browser.mjs` needs the local mobile client at `http://127.0.0.1:4180` and tests a 390-pixel browser viewport. These do not establish Android purchase, consent, ad display or native PDF sharing. See `implementation-status.md` for actual results and deployment IDs.
