# Next Gen submission checklist

Checked October 1, 2026 against the official [Devpost overview](https://revenuecat-shipaton-2026.devpost.com/), [Next Gen eligibility page](https://www.shipaton.com/next-gen) and [organizer Test Store confirmation](https://revenuecat-shipaton-2026.devpost.com/forum_topics/44695-next-gen-eligibility-is-a-test-store-only-purchase-sufficient).

**Current published deadline:** October 1, 2026, 12:00 PDT / **20:00 Africa/Lagos (WAT)**. This supersedes the earlier September 30 deadline in planning documents. The overview's introductory text still mentions September 30; its current deadline banner shows the extension. The Devpost form is the final submission gate.

## Ready

- Public source repository: https://github.com/adetorojeremiahfadesayo/StudyMate-Shipaton-2026
- Owner-approved MIT license and preserved upstream attribution/history.
- Original 1024 × 1024 app icon and three 1179 × 2556 browser-preview screenshots prepared in `output/playwright/submission/`; upload and form attachment are not yet verified.
- Live browser preview: https://adetorojeremiahfadesayo.github.io/StudyMate-Shipaton-2026/
- Existing Railway backend deployed from the hackathon GitHub branch, including final quota/credit/Schools and webhook fixes.
- RevenueCat Pro Test Store product, ten-session consumable and offerings configured. Live dashboard TEST webhook returned 200 without granting credits.
- Existing judge account preserved; share its credentials privately in the appropriate judge-access field, never in the repository or video.
- Browser/API checks recorded in `implementation-status.md`. The Android Test Store APK compiled and uploaded successfully in [build 36898273019](https://github.com/adetorojeremiahfadesayo/StudyMate-Shipaton-2026/actions/runs/36898273019), artifact `StudyMate-Android-TestStore`. Build success does not establish native runtime.

## Still to complete

1. **Android testing:** install the Test Store APK on an Android device or emulator. Verify sign-in, upload → learn → practice → saved revision PDF, RevenueCat subscription/restore and ten-session top-up, account switch, Free ad behavior and PDF sharing. Record observed results. A dashboard TEST webhook is not a purchase.
2. **Video:** show the app running on Android, a clear study journey and the real RevenueCat Test Store purchase/unlocked feature. Keep essential footage at or below two minutes. Upload to YouTube or Vimeo with a publicly accessible or unlisted link; private videos cannot be judged. Label Test Store behavior honestly.
3. **Submission images:** upload the prepared 1024 × 1024 app icon and at least one 1179 × 2556 screenshot without a device frame. The library image is the suggested first screenshot; label them as browser-preview captures.
4. **Devpost form:** select Next Gen; provide the description, source link, video, images and judge-access instructions. Check that the Devpost account uses a recognized student/academic email. Complete any applicable age/guardian eligibility requirements and required confirmations truthfully. Submit and verify the receipt/status.

## Not required for Next Gen

A paid Apple/Google developer account and an app-store listing are not required for this track. The organizer has confirmed Test Store is sufficient. Production Play products, production SDK keys and production AdMob IDs can be handled for a later real store release; `android-release.md` contains the proposed mapping and setup steps.

This checklist records requirements and available evidence. It does not confirm the user's student-email eligibility, native purchase, video visibility, image readiness or submitted status.
