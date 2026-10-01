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

Reference: [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
