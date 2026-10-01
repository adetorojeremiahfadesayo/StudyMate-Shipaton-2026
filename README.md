# StudyMate Mobile

<div align="center">

<img src="mobile/public/studymate-icon.svg" alt="StudyMate Mobile icon" width="120" />

### Turn your own course material into explanations, teaching stories, exam practice and a revision PDF — in your pocket.

[![RevenueCat Shipaton 2026](https://img.shields.io/badge/RevenueCat-Shipaton_2026-F2545B?logo=revenuecat&logoColor=white)](https://revenuecat-shipaton-2026.devpost.com/)
[![Next Gen](https://img.shields.io/badge/Track-Next_Gen-8A2BE2)](https://www.shipaton.com/next-gen)
[![Android](https://img.shields.io/badge/Android-Capacitor-3DDC84?logo=android&logoColor=white)](https://capacitorjs.com)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-backend-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_Postgres-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**[🌐 Browser preview](https://adetorojeremiahfadesayo.github.io/Studymate-with-Matey/)** · **[📦 Android Test Store APK](https://github.com/adetorojeremiahfadesayo/Studymate-with-Matey/actions/runs/36902184856)** · **[🖥️ Backend / web app](https://studymate-pro.up.railway.app/)**

[At a Glance](#-at-a-glance) | [Ada's Story](#-how-to-use-studymate--adas-story) | [RevenueCat](#-powered-by-revenuecat) | [Architecture](#%EF%B8%8F-architecture) | [Quick Start](#-quick-start) | [Status](#-honest-status)

</div>

---

## 📌 At a Glance

| Item | Details |
|---|---|
| 🏆 Hackathon | [RevenueCat Shipaton 2026](https://revenuecat-shipaton-2026.devpost.com/) — **Next Gen** track |
| 📱 Platform | Android (Capacitor) with a mobile browser preview |
| 💳 Monetization | RevenueCat Capacitor SDK — Pro subscription + ten-session top-up (Test Store) |
| 🧠 Core hook | Learn your own material in **Plain Mode** or **Story Mode**, practise, get feedback, export a revision PDF |
| 🏫 Extra | Schools pilot: classes, invitations, assignments and a visible study timer |
| 🧰 Stack | React, Vite, Capacitor, Next.js, Supabase, Postgres, OpenAI, Railway, GitHub Actions |
| 🔗 Source | [adetorojeremiahfadesayo/Studymate-with-Matey](https://github.com/adetorojeremiahfadesayo/Studymate-with-Matey) |

## 😩 The Problem

Students revise from scattered PDFs, lecture notes, scanned pages and past questions. Having the notes is only the start: they still need to *understand* the ideas, *apply* them to questions and work out *what to revise*.

Most AI study tools stop at summaries — and most of them live on a laptop, not in the phone students actually carry. StudyMate goes further.

## 💡 The Solution

StudyMate Mobile turns a student's own course material into one guided study session:

```text
📤 Upload material
  -> 📚 organise it into a course
  -> 🧠 learn in Plain Mode or Story Mode (with source citations)
  -> ✍️ practise exam-style questions
  -> 🔍 get saved feedback and weak areas, retry what you missed
  -> 📄 export a revision PDF you can keep
```

## 🦜 Meet Matey

<div align="center">

<img src="studymate/public/studymate-assets/matey/matey-welcome.png" alt="Matey, the StudyMate coach" width="180" />

*Your personal study coach, always in your corner.*

</div>

Matey is the friendly guide who turns StudyMate from a blank chat box into a complete learning journey.

| Stage | What Matey Does |
|---|---|
| 📤 **Upload** | Helps students load notes, PDFs, images or pasted text into a course |
| 🧾 **Plain Mode** | Explains difficult concepts clearly and directly |
| 🎭 **Story Mode** | Turns a topic into a memorable scenario, such as advising a client in a law problem |
| ✍️ **Practice** | Coaches students through exam-style questions graded on the server |
| 📄 **Revision PDF** | Celebrates the finish with a PDF of the study work, answers and feedback |

## 🎨 Visual Tour

<div align="center">

| Story: Client Scenario | Story: Courtroom | Matey Thinking |
|:---:|:---:|:---:|
| <img src="studymate/public/studymate-assets/story-law-client-office.png" alt="Story Mode client scenario" width="260" /> | <img src="studymate/public/studymate-assets/story-law-courtroom.png" alt="Story Mode courtroom scenario" width="260" /> | <img src="studymate/public/studymate-assets/matey/matey-thinking.png" alt="Matey thinking through a study problem" width="180" /> |
| *Learn by advising a client* | *Apply the rule under pressure* | *Matey works through it with you* |

| Medicine | Engineering | Economics |
|:---:|:---:|:---:|
| <img src="studymate/public/studymate-assets/story-medicine-clinic.png" alt="Story Mode medicine clinic" width="260" /> | <img src="studymate/public/studymate-assets/story-engineering-lab.png" alt="Story Mode engineering lab" width="260" /> | <img src="studymate/public/studymate-assets/story-economics-policy.png" alt="Story Mode economics policy" width="260" /> |

</div>

### 🏅 Reward Moment

<div align="center">

<img src="studymate/public/studymate-assets/reward-certificate.png" alt="StudyMate revision reward" width="520" />

*Finish the session, review weak areas and download a revision PDF you can keep.*

</div>

> 🖼️ Story art and Matey are shared with the StudyMate web foundation. Mobile submission screenshots (1179 × 2556) are browser-preview captures.

---

## 📖 How to Use StudyMate — Ada's Story

> *Meet Ada, a second-year law student. Her Tort Law exam is in nine days, and her notes are a 40-page lecture PDF, a few phone photos of the whiteboard and a past question she can't crack.*

| | Ada's journey | What you do in the app |
|:---:|---|---|
| <img src="studymate/public/studymate-assets/matey/matey-welcome.png" width="90" alt="Matey welcoming" /> | **Day 1, 9 pm.** Ada signs in on her Android phone and Matey greets her. She creates a course called *Negligence: duty of care* and uploads her lecture PDF and whiteboard photos. | **Sign in → Courses → New course → Upload.** Your notes become the source StudyMate learns from. |
| <img src="studymate/public/studymate-assets/matey/matey-reading.png" width="90" alt="Matey reading" /> | She types *"Negligence requirements"* and taps **Plain**. A clear explanation of duty, breach, causation and damage appears, with citations from her own notes. | **Study → choose a topic → Plain → Explain this topic.** |
| <img src="studymate/public/studymate-assets/story-law-client-office.png" width="90" alt="Story Mode client office" /> | The theory still feels abstract, so she flips to **Story**. Now *she* is a junior lawyer advising a client whose ceiling collapsed. Each element of negligence becomes a question she has to answer for the client. | **Switch to Story → Explain this topic.** The same material is retold as a scenario. |
| <img src="studymate/public/studymate-assets/matey/matey-thinking.png" width="90" alt="Matey thinking" /> | Ready to test herself, Ada starts a practice set and answers exam-style questions. The server marks her answers and saves the feedback. She nailed duty of care but missed **factual causation**. | **Practice → answer → Submit.** Grading happens on the server, and the feedback is saved. |
| <img src="studymate/public/studymate-assets/story-law-courtroom.png" width="90" alt="Courtroom scenario" /> | She taps **Retry weak areas** and gets a targeted round on causation, this time framed as a courtroom argument. It clicks. | **Retry weak areas** focuses on what you missed. |
| <img src="studymate/public/studymate-assets/matey/matey-celebrate.png" width="90" alt="Matey celebrating" /> | Session done. She exports a **revision PDF** with the explanations, her answers and the feedback, then shares it to her study group. Opening it again later doesn't use another session. | **Export revision PDF → Download / Share.** |
| ⭐ | By Day 5 she has used her three Free sessions. She adds a second course (Contract Law), so she upgrades to **Pro**: five courses and 30 sessions a month, with no ads. Before the exam she buys a **ten-session top-up** for one last push. | **Pro & credits → Subscribe or Top up.** Purchases go through RevenueCat; the server verifies access. |

> 🏫 *Her lecturer could also add the class through **Schools**, set "Negligence" as an assignment and see aggregate practice results, while a visible study timer tracks time in the app.*

*Ada is an illustrative persona; the flow matches the features listed below.*

## 🔁 How It Works

| Step | What happens |
|:---:|---|
| 1️⃣ **Sign in** | Supabase authentication; the same account is used as the RevenueCat App User ID |
| 2️⃣ **Create a course** | Upload course material; it is stored and prepared on the backend |
| 3️⃣ **Learn** | Choose a topic and read it in Plain Mode or Story Mode, grounded in the stored material |
| 4️⃣ **Practise** | Answer questions; grading uses owned, persisted questions — never a client-supplied score |
| 5️⃣ **Review & retry** | Saved feedback highlights weak areas for a targeted retry |
| 6️⃣ **Export** | Generate a revision PDF; retrieving saved work or exporting does not consume another session |

## 💳 Powered by RevenueCat

RevenueCat's Capacitor SDK loads offerings using the signed-in Supabase user ID. The backend — not the client — decides what a user can access.

| Plan | Active courses | Study sessions | Ads |
|---|:---:|:---:|:---:|
| 🆓 **Free** | 1 | 3 / month | Test ads at practice breaks |
| ⭐ **Pro** subscription | 5 | 30 / month | No ads |
| ➕ **Ten-session top-up** (consumable) | — | +10 sessions | Does not grant Pro or remove ads |
| 🏫 **Schools** pilot | Class-based | School pool | No ads |

*Current RevenueCat **Test Store** prices: $5.99/month for Pro and $1.99 for ten sessions. These are testing prices, not a production store launch.*

**How purchases stay trustworthy**

- ✅ Pro access is verified on the server with RevenueCat; client flags never grant premium access.
- ✅ Authenticated purchase webhooks feed a server-side **credit ledger**.
- ✅ Duplicate webhook deliveries cannot award the same credits twice; supported refunds reverse them.
- ✅ Monthly quotas, course limits and school pools are enforced with atomic reservations on the server.

## 🏫 Schools Pilot

Teachers can create classes, invite students, set assignments and review assigned activity and aggregate practice results. A visible study timer pauses when the app is backgrounded or the student is inactive — it measures app activity, not attention or comprehension.

## 🌟 Why StudyMate Stands Out

| Other study apps | StudyMate Mobile |
|---|---|
| Generic summaries | Explanations grounded in the student's own material, with citations |
| One chat box | Guided loop: upload → learn → practise → feedback → PDF |
| Passive reading | Story Mode turns topics into memorable scenarios |
| Scores from the client | Server-side grading on persisted questions |
| Paywall bolted on | Quotas, credits and entitlements enforced and verified on the backend |
| Laptop-only | Android app built with Capacitor, plus a mobile browser preview |

## 🏗️ Architecture

```text
📱 mobile/  React + TypeScript + Vite, packaged with Capacitor for Android
|
|-- Supabase Auth (public anon key only)
|-- RevenueCat Capacitor SDK  -> offerings, purchase, restore (App User ID = Supabase user)
|-- AdMob test ads           -> Free tier only, checked against server access
|-- Filesystem / Share       -> revision PDF download and share
|
v  HTTPS + bearer token
🖥️ studymate/  Next.js backend on Railway
|
|-- Courses, uploads and file storage (Supabase Postgres + Storage)
|-- Study generation with OpenAI: Plain Mode, Story Mode, practice, feedback
|-- Server grading on owned, persisted questions
|-- Quotas, credit ledger, Schools pools and timers
|-- RevenueCat entitlement verification + authenticated webhook (dedupe, refunds)
|-- Revision PDF generation
```

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Mobile client | React, TypeScript, Vite |
| Native shell | Capacitor (Android) |
| Monetization | RevenueCat Capacitor SDK, RevenueCat webhooks |
| Ads | AdMob (test IDs, Free tier) |
| Backend | Next.js App Router on Railway |
| Auth, database, storage | Supabase, PostgreSQL |
| AI | OpenAI |
| CI/CD | GitHub Actions (Android APK), GitHub Pages (browser preview) |
| Testing | Vitest, live API checks |

## 🚀 Quick Start

### Backend / web app

```sh
cd studymate
npm ci
cp .env.example .env.local
# Configure your own service credentials securely.
npm run dev
```

Backend checks: `npm run lint`, `npm test`, `npm run build`.

### Android client

```sh
cd mobile
cp .env.example .env
# Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL
# and VITE_REVENUECAT_PUBLIC_SDK_KEY (public key only).
npm install
npm run build
npm run android:sync
npm run android:open
```

The app ID is `com.studymate.mobile`. Full setup is in [mobile/README.md](mobile/README.md). Server secrets such as `REVENUECAT_SECRET_API_KEY` belong on the backend only.

## 🧑‍⚖️ For Judges

- 🌐 **[Browser preview](https://adetorojeremiahfadesayo.github.io/Studymate-with-Matey/)** uses the live backend. Browser purchases are intentionally disabled.
- 📦 **[Android Test Store APK](https://github.com/adetorojeremiahfadesayo/Studymate-with-Matey/actions/runs/36902184856)** (artifact `StudyMate-Android-TestStore`) is the build for RevenueCat billing.
- 🔑 A judge test account is shared privately through the submission form; its password is not in this repository.
- ⚠️ The web app's `/demo` route contains sample material and is not evidence of live AI or purchases.

## 📊 Honest Status

| Area | Status |
|---|---|
| Real AI study journey (prepare → learn → practise → grade → retry → PDF) on the live backend | ✅ Live tested |
| 18 commerce/database checks: quotas, credits, ownership, Schools boundaries | ✅ Live tested |
| Authenticated 390 px browser-preview check against the deployed backend | ✅ Live tested |
| RevenueCat dashboard TEST webhook → live backend (HTTP 200, no credits granted) | ✅ Live tested |
| Android Test Store APK compiled in GitHub Actions | ✅ Built |
| Native Android purchase / restore / top-up, ads and PDF sharing | ⏳ Not yet verified on device |
| Practice source-filename labels match the uploaded file | ⚠️ Known limitation |

Full evidence and blockers: [docs/implementation-status.md](docs/implementation-status.md). A compiled APK or webhook test is not proof of a completed native purchase.

## 🔐 Security

Never commit real keys, tokens, student data or private course material. The mobile bundle contains only public values (Supabase URL/anon key, backend URL, RevenueCat public SDK key). Before publishing, verify no env file is tracked:

```sh
git ls-files -- ".env*" "**/.env*"
```

That command should return nothing.

## ✅ Shipaton Next Gen Checklist

- [x] Android app using the RevenueCat SDK for a subscription and a consumable (Test Store)
- [x] Public open-source repository under the MIT license
- [x] 1024 × 1024 app icon and 1179 × 2556 screenshots prepared
- [x] Live browser preview and backend
- [ ] Native Android test of purchase/restore and top-up
- [ ] Public/unlisted demo video showing the app on Android and a Test Store purchase
- [ ] Devpost form completed and submitted

See [docs/submission-checklist.md](docs/submission-checklist.md) and [docs/devpost-draft.md](docs/devpost-draft.md).

## 📚 More Docs

- [Implementation plan](docs/implementation-plan.md) — architecture, milestones, data/API contracts
- [Implementation status](docs/implementation-status.md) — actual progress and blockers
- [Backend billing setup](docs/backend-billing-setup.md) · [Android release](docs/android-release.md) · [Pricing proposal](docs/pricing-proposal.md) · [Commerce & Schools](docs/commerce-and-schools.md)
- [GitHub preview setup](docs/github-preview.md) · [Hoplite task](docs/HOPLITE.md) · [Agent instructions](AGENTS.md)
- [Product context](studymate/CONTEXT.md) · [Original README](docs/original-README.md)

## 🌱 Origins

StudyMate Mobile builds on **[StudyMate](https://github.com/adetorojeremiahfadesayo/StudyMate)**, the web study coach that won the **Agents League Hackathon — Creative Apps track**. It was imported from source snapshot `5465815` on September 21, 2026 with a new commit history; the original history remains in the source repository, which was not modified. Building on that foundation does not imply all work began during the event.

StudyMate code is available under the [MIT license](LICENSE), approved by its owner. Third-party components keep their own licenses.

---

<div align="center">

<img src="studymate/public/studymate-assets/matey/matey-celebrate.png" alt="Matey celebrating" width="120" />

*Good luck. Now go ace that exam.* 🎓

</div>
