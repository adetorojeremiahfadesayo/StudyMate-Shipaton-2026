# Android billing: hackathon and later store release

## Next Gen submission

A paid Google Play developer account and store release are not required for Next Gen. The organizers confirmed that RevenueCat Test Store is sufficient. Keep the current Test Store products and key for the hackathon; demonstrate an actual SDK purchase during Android testing.

- [Official submission requirements](https://revenuecat-shipaton-2026.devpost.com/)
- [Organizer confirmation about Test Store](https://revenuecat-shipaton-2026.devpost.com/forum_topics/44695-next-gen-eligibility-is-a-test-store-only-purchase-sufficient)

Public source, an open-source license, required images, and the demo video still need to satisfy the official rules. A deployed browser preview does not replace native purchase evidence.

## Later Google Play release

These are proposed identifiers, **not products that have been created**:

| Item | Proposed value |
|---|---|
| Android package, already in source | `com.studymate.mobile` |
| Play subscription ID | `studymate_pro_v1` |
| Monthly auto-renewing base plan | `monthly-auto` |
| RevenueCat Play subscription identifier | `studymate_pro_v1:monthly-auto` |
| Consumable ten-session product ID | `studymate_sessions_10_v1` |
| Pro entitlement, already configured | `studymate_pro` |
| Subscription offering/package | `default` / `$rc_monthly` |
| Credit offering/package | `session_topups` / `credits_10` |

1. Create a Google Play Console developer account and the StudyMate app. Upload a signed build using the same Android package. Complete Google's required account/app setup.
2. In Play Console **Monetize → Products → Subscriptions**, create the subscription, add the monthly auto-renewing base plan, choose supported regions/prices, then activate the base plan. The approved USD 5.99 is a test default; review regional pricing before a real release.
3. Create the USD 1.99 ten-session one-time product and activate its purchasable configuration. It must remain consumable; do not attach it to the Pro entitlement.
4. In the existing RevenueCat project, add a **Google Play app** using `com.studymate.mobile`. Generate a Google Cloud service-account credential, grant the app-specific Play permissions required by RevenueCat, and upload its JSON directly to RevenueCat. Do not commit or send that private credential to the browser client. Credential activation can take time.
5. Import the Play products into RevenueCat. Attach only the subscription to `studymate_pro`. Map the subscription to `default` / `$rc_monthly`, and the consumable to `session_topups` / `credits_10` for the Play app.
6. For the release client, use the Play app's **public** RevenueCat SDK key rather than the Test Store key. Update the currently test-specific top-up product lookup. On Railway, approve the actual Play app ID and consumable product ID in `REVENUECAT_ALLOWED_APP_IDS` and `REVENUECAT_CREDIT_PRODUCT_IDS`. Keep secret API/webhook credentials server-side. Preserve the Test Store configuration for testing.
7. Configure Google real-time developer notifications, then test through Google's internal testing/license-tester path: subscription purchase, restore, expiry/account switch, consumable purchase, duplicate webhook, refund and ledger recovery. Sign in using the same StudyMate account identity. Publish a production release only after these checks.

References: [RevenueCat Play product setup](https://www.revenuecat.com/docs/getting-started/entitlements/android-products), [store connection](https://www.revenuecat.com/docs/projects/connect-a-store), [Play service credentials](https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials).
