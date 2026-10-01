# Separate hackathon GitHub preview

Target repository: `adetorojeremiahfadesayo/StudyMate-Shipaton-2026`.

The mobile React/Vite client can be published with GitHub Pages. Its authenticated API calls continue to use the existing Railway backend. This deployment does not host the Next.js server or create another database.

## Configuration

Set these repository Actions variables from your public client configuration:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (anon or publishable key only)
- `VITE_API_BASE_URL`

Never set service-role, AI, RevenueCat secret or webhook credentials here. The workflow validates the public key type without printing its value. Browser purchases and native ads remain unavailable in this preview.

Enable GitHub Pages with **GitHub Actions** as the build source. Set the repository's default branch to `codex/mobile-mvp`; `.github/workflows/hackathon-preview.yml` builds that branch. Its repository guard restricts publishing to the separate hackathon repository. Public client variables must be configured before its first run.

The workflow installs pinned mobile dependencies, runs the existing ad policy tests, checks TypeScript, builds with the repository subpath, uploads only `mobile/dist`, and deploys to the `github-pages` environment. It does not upload environment files, backend credentials or the local working directory.

Once deployment succeeds, verify the published page, its JavaScript/assets, sign-in, server allowance, account isolation and sign-out. A successful browser check does not prove native purchases or Android behavior.

## Android test build

`.github/workflows/android-test-build.yml` is manually triggered and requires the public `VITE_REVENUECAT_PUBLIC_SDK_KEY` repository variable to use a `test_` key. It builds a debug APK with Java 21, Android SDK 36 and the pinned Gradle wrapper. GitHub Actions provides the build tooling; no Play Console account, signing key or store publication is used. The `StudyMate-Android-TestStore` artifact is an installable testing build, not evidence that native billing or ads worked.

Use the existing approved judge account when testing sandbox billing. The server sandbox allowlist prevents purchases by other accounts from granting premium access or credit balances. Store-release billing is a separate configuration described in `android-release.md`.

Reference: [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
