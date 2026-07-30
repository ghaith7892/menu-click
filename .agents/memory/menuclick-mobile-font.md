---
name: MenuClick Mobile font
description: Arabic font setup for the Expo mobile app
---

The mobile app uses Cairo (Google Font) for Arabic script support, matching the web app's `--app-font-sans: 'Cairo', 'Inter', sans-serif`.

**Package:** `@expo-google-fonts/cairo` (installed in `artifacts/menu-mobile/package.json`)

**Weights used:**
- `Cairo_400Regular`
- `Cairo_600SemiBold`
- `Cairo_700Bold`

**Loaded in:** `app/_layout.tsx` via `useFonts({ Cairo_400Regular, Cairo_600SemiBold, Cairo_700Bold })` with SplashScreen gating.

**Why:** Inter (the scaffold default) doesn't support Arabic script. Cairo covers both Arabic and Latin scripts and matches the web app's font choice.
