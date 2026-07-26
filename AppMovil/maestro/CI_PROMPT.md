# Maestro CI/CD — Prompt for Antigravity

Copy and paste this into Antigravity Agent mode:

---

Generate a GitHub Actions workflow that runs Maestro E2E tests on every PR to `main` and `develop`. Save as `.github/workflows/maestro-tests.yml`.

## Requirements
- Platform: Android (emulator) — iOS would need macOS runner
- appId: `com.iglesiadigital.app`
- Project structure: Monorepo with Expo app at `AppMovil/`
- Build: `npx expo export --platform android` (or provide APK build instructions for EAS)

## Workflow Steps
1. Checkout repo
2. Install dependencies (`npm ci` in AppMovil/)
3. Install Maestro CLI
4. Build APK (use `eas build --platform android --profile preview --local` or `expo export` + `eas build`)
5. Start Android emulator (use `reactivecircus/android-emulator-runner`)
6. Install APK on emulator
7. Run `maestro test maestro/flows/ --format junit --output test-results.xml`
8. Upload test results and screenshots as artifacts
9. Notify on failure (optional: GitHub check)

Include environment variables for MAESTRO_CLI_NO_ANALYTICS and MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED.
