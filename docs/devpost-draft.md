# StudyMate Mobile — Devpost draft

Prepared October 1, 2026 from the implementation and verification record. These are draft fields, not confirmation that the Devpost form was saved or submitted.

## Project name

StudyMate Mobile

## Elevator pitch

Turn your course material into clear explanations, teaching stories, exam practice and a revision PDF—with flexible study access powered by RevenueCat.

## Inspiration

Having course notes is only the start of exam preparation. Students still need to understand the ideas, apply them to questions and identify what to revise. StudyMate brings those steps into one guided journey using the student's own material. Story Mode connects an abstract concept to a situation; Plain Mode gives a direct explanation of the same topic.

## What it does

Students upload course material, choose a topic, learn in Plain or Story Mode, answer practice questions, review saved feedback and retry weak areas. They can export a revision PDF containing the study work and their answers. Generation uses the course's stored material; accurate practice source-filename validation remains a known limitation found during screenshot preparation.

Free access includes one active course and three study sessions per month. Pro expands this to five active courses and thirty sessions. A ten-session top-up adds extra study capacity without changing the subscription. Current RevenueCat Test Store prices are $5.99/month for Pro and $1.99 for ten sessions; these are testing prices, not a production store launch.

A Schools pilot adds classes, invitations, assignments and a visible study timer. Teachers can review assigned activity and aggregate practice results. The timer pauses when the app is backgrounded or the student is inactive; it measures app activity, not proof of attention or comprehension.

## How we built it

The mobile client uses React, TypeScript and Vite, packaged for Android with Capacitor. It reuses StudyMate's existing Next.js backend deployed on Railway, with Supabase authentication, Postgres and file storage. OpenAI powers the current live AI study flow. The mobile work builds on the existing StudyMate web foundation; upstream attribution is preserved in the open-source repository.

RevenueCat's Capacitor SDK loads subscription and consumable offerings using the signed-in Supabase user ID. The backend verifies Pro access and applies authenticated purchase webhooks to a credit ledger. The subscription and ten-session consumable are separate: buying extra sessions does not grant Pro or remove Free ads. Duplicate webhook deliveries cannot award the same credits twice, and supported refunds reverse the corresponding credits.

Monthly quotas, course limits and school pools are enforced on the server. Successful study work is saved so retrieving it or exporting a PDF does not consume another session. Grading uses owned, persisted questions instead of accepting a score supplied by the client.

## Challenges we ran into

Reliable billing meant coordinating subscriptions, consumable credits, quotas and account identity across the mobile client and backend. We added transaction/event deduplication, refund handling and atomic quota reservations to avoid duplicate grants or concurrent requests exceeding limits.

Connecting the existing backend required database compatibility fixes and a working AI provider. We also repaired the Android build environment after an SDK setup action requested a package Google no longer serves. GitHub Actions now produces a downloadable Android Test Store APK.

## Accomplishments that we're proud of

- A real backend journey completed material preparation, cited learning, practice, saved grading, a targeted retry and revision PDF generation while consuming one study session.
- Eighteen live commerce/database checks passed for quotas, credits, ownership and school access boundaries.
- The public mobile browser preview passed an authenticated narrow-screen check against the deployed backend.
- RevenueCat's dashboard TEST webhook reached the live backend and returned HTTP 200 without granting credits.
- The Android debug APK compiled successfully, and the hackathon repository is public under the MIT license.

## What we learned

A subscription screen is only one part of a monetized learning app. Access rules must remain correct when a user switches accounts, a request repeats, a purchase is refunded or AI generation fails. We also learned to keep build, browser, backend and native-device evidence separate: a successful APK build or webhook test does not establish a completed mobile purchase.

## What's next for StudyMate Mobile

Complete Android device/emulator testing, including the RevenueCat Test Store subscription, restore and ten-session top-up. Verify native PDF sharing and Free test-ad behavior, then use student feedback to refine the study journey and regional pricing. Production Google Play products and ad configuration belong to a later store release. The Schools pilot needs teacher/student feedback before broader deployment.

## Built with

React, TypeScript, Vite, Capacitor, Android, RevenueCat, Next.js, Supabase, PostgreSQL, OpenAI, Railway, GitHub Actions, GitHub Pages.

## Links

- Source: https://github.com/adetorojeremiahfadesayo/StudyMate-Shipaton-2026
- Browser preview: https://adetorojeremiahfadesayo.github.io/StudyMate-Shipaton-2026/
- Android APK build with the matching icon: https://github.com/adetorojeremiahfadesayo/StudyMate-Shipaton-2026/actions/runs/36902184856
- Backend/web foundation: https://studymate-pro.up.railway.app/

## Judge testing notes

The browser preview uses the live backend. Browser purchases are disabled; use the Android Test Store APK for billing. The existing web `/demo` route contains sample material and is not evidence of live AI or purchases. Existing judge-account credentials must be supplied privately by the owner in the appropriate access field; they are not included here.

Native purchase/restore, ads and PDF sharing have not yet been verified. Dashboard TEST delivery did not make a purchase or grant credits. Practice source labels need validation against the real uploaded filename. Icon and browser-preview screenshots are prepared; video, asset upload, academic-email eligibility and final submission remain pending.
