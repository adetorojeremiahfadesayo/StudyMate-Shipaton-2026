# StudyMate pricing direction — October 1, 2026

**Decision:** Free, Pro, and Schools. The user approved this tier and feature direction. **No prices, quotas, credits, or school monitoring below are live.** The local mobile build currently offers three-question sets for Free and server-gates five-question sets behind `studymate_pro`. There is no configured monetary price. Before selling the plans below, implement server-side usage counting, truthful paywall copy, purchase/restore testing, and cost measurement.

## What to sell

Sell the outcome: turn a student's own material into an explanation, exam practice, feedback, and a reusable revision PDF. Keep a useful Free tier. Avoid charging separately for opening a saved PDF or viewing already-generated material.

Define one **guided study session** as: one topic from uploaded material, one Plain or Story explanation, one practice set (up to five questions), one feedback/retry pass, and one revision PDF. This is a proposed billing unit; the current app does not yet deliver or meter the entire unit. Bound upload size, pages, model output, and retries so its cost is measurable. A student should see sessions remaining before starting one.

| Tier | Agreed price direction, pending cost validation | Proposed monthly allowance | Main reason to upgrade |
|---|---|---:|---|
| Free | $0 | 1 active course; 3 guided sessions | Try the full learning loop and keep saved work/PDFs |
| Pro | US $5.99/month; Nigeria ₦2,500–3,000/month test range | More courses; 30 guided sessions | Frequent exam preparation, deeper cited feedback and weak-area retries |
| Schools | Quote per active student or campus pilot | Pooled school allowance with per-student safeguards | Assignments, teacher/admin dashboard, usage and completion reporting, support |

The Nigerian range is an **affordability experiment**, not a currency conversion or validated willingness to pay. The exact Nigerian price and Pro course cap are still undecided. No annual plan or unlimited AI promise at first. Review costs, store deductions/taxes and interviews with Nigerian and international students before activating real prices. Quizlet's public US page lists $2.99/month billed annually for Plus and $3.75/month billed annually for Plus Unlimited; StudyFetch's US App Store listing shows a $19.99 monthly purchase. These are positioning references, not proof StudyMate can charge the suggested amounts. Sources: [Quizlet](https://quizlet.com/upgrade), [StudyFetch App Store](https://apps.apple.com/us/app/studyfetch-make-learning-easy/id6663574866).

Pro feature direction: a larger session allowance, more courses and longer practice, deeper cited answer feedback, weak-area retries, and longer-term revision progress. Free keeps the basic upload → learn → practice → revision PDF loop. School adds assignments, a required visible timer for assigned sessions, and teacher/admin reporting. These are build targets; today's mobile client implements only the longer Pro question set.

User approved intermittent ads for Free. The native test integration now makes an interstitial eligible after every second completed practice set, with at least ten minutes between displays. Server-verified Pro/Schools access skips ads; unknown billing access also skips ads. Consent handling and six policy checks are implemented, but native display/dismissal and paid suppression still need device verification. Production publisher IDs are not configured. Ads must not interrupt answering, reading feedback, PDF export, or a purchase. [Google interstitial guidance](https://developers.google.com/admob/android/interstitial).

## Credits and feature monetization

Use subscriptions for recurring study allowance. Offer an optional **10-session top-up** only when a student reaches their allowance. Show the exact number of sessions and what one session includes. Let students retain access to past work when they run out. Do not sell separate credits for every click, mode switch, answer view, or PDF download; that makes the study loop unpredictable.

RevenueCat can sell consumables and grant In-App Currency, but spending currency requires a trusted backend. Consumable purchases should not be attached to `studymate_pro` or another perpetual access entitlement. Build a server-side credit ledger or use RevenueCat In-App Currency with server-side debits, idempotency, refunds and account reconciliation. Sources: [RevenueCat non-subscription purchases](https://www.revenuecat.com/docs/platform-resources/non-subscriptions), [In-App Currency](https://www.revenuecat.com/docs/offerings/virtual-currency).

Possible later add-ons: human-reviewed exam packs or institution-authored course collections, if rights and demand are clear. Source-grounded explanations, basic feedback, and the earned revision PDF should remain in the main subscription rather than being charged repeatedly.

## School plan and required study timer

Make the timer **required within a school-assigned study session**. Students see the timer, can pause with a reason, and can finish the task. An admin sees assignment status, start/end times, active minutes, and completed practice. A timer measures app activity, **not attention, comprehension, or whether the student actually read**. Show practice outcomes separately; never label idle time as learning. Do not capture document contents, keystrokes, or background phone activity for monitoring.

School administrators can set an assigned time target, see aggregate class trends, and identify students who may need support. Teachers should see only their assigned classes. Students should see what is shared and be able to review their own record. Set retention and export/deletion controls before a school pilot. Keep personal study outside an assigned session separate from required school tracking.

Price Schools by **active seat plus a pooled AI allowance**, with a capped 30-day pilot and custom quote after actual usage. Do not publish a per-school price before validating admin demand, support burden and data handling. School licensing is a separate sales/admin flow, not another choice on the student's mobile subscription paywall.

## Implementation order and decision gates

1. **Hackathon/test flow:** one `studymate_pro` monthly Test Store product and a real Android debug purchase. Keep today's three/five-question wording truthful.
2. **Measure unit cost:** record AI input/output usage and cost for 20–30 representative upload → learn → practice journeys, including failed/retried generations, storage and OCR. Calculate expected cost per guided session and a high-use month.
3. **Build the paid value:** persist answers/feedback and PDF content; enforce course/session quotas atomically on the server; support account changes and entitlement expiry. Keep one consumer entitlement, `studymate_pro`, and make the paywall describe only working features.
4. **Price test:** interview students in Nigeria and an international sample, then test the proposed monthly prices and conversion/retention. Use Google Play regional subscription prices for real Android billing; the Test Store price is only a test value. [Google Play regional pricing](https://support.google.com/googleplay/android-developer/answer/12154973?hl=en).
5. **Credits and Schools:** add top-ups after metering is trustworthy; pilot assigned-session tracking with one school before publishing an enterprise offer.

Decision rule: do not approve a real tier until the promised features work, its allowance is enforceable, and expected per-user gross revenue covers realistic high-use AI cost plus platform/operations cost with room for support and growth.
