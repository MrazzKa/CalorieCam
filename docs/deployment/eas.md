# Expo EAS & TestFlight Guide

This document captures the minimal steps required to ship the mobile client to TestFlight.

## 1. Expo Setup

1. Install Expo/EAS CLIs
   ```bash
   pnpm dlx expo install --check
   pnpm add -g eas-cli
   eas --version
   ```
2. Log in to Expo
   ```bash
   eas login
   ```
3. Ensure root `.env` only contains `EXPO_PUBLIC_*` variables (see project README).

## 2. EAS Project Config

- Check `app.config.js` for bundle identifiers (`com.caloriecam.app`).
- Update `process.env.EAS_PROJECT_ID` (or hard-code the value) so `extra.eas.projectId` resolves correctly.
- `eas.json` defines the build profiles:
  - `preview` – internal distribution (used for TestFlight preview)
  - `production` – App Store submission build (update the Apple ID / ASC app id placeholders before use)

## 3. Build Profiles

```bash
# Configure the project with EAS (first time only)
eas init

# Internal preview/TestFlight build
eas build -p ios --profile preview

# Promote to production when ready
eas build -p ios --profile production
```

Important flags:

- `EXPO_PUBLIC_API_BASE_URL` must point to the Railway deployment (e.g. `https://api.caloriecam.app`).
- Set `EXPO_PUBLIC_ENV=production` for production builds (`preview` can keep `staging`).

## 4. Submit to TestFlight

```bash
eas submit -p ios --latest --profile production
```

You can also submit a specific build:

```bash
eas submit -p ios --id <BUILD_ID>
```

## 5. QA Checklist

After a build lands on TestFlight:

1. OTP login flow with SendGrid email.
2. USDA search (online/offline cache).
3. Image capture + analysis.
4. Articles feed & detail displays.
5. Push notifications opt-in & preference toggle.
6. AI assistant session resume.

Document results in the release notes; if a check fails, reject the build and resolve before re-submitting.
