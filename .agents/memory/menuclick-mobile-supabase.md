---
name: MenuClick Mobile Supabase setup
description: How the Expo mobile app connects to Supabase and what env vars it uses
---

The mobile app (`artifacts/menu-mobile`) connects directly to Supabase using the same project as the web app.

**Env vars (shared environment):**
- `EXPO_PUBLIC_SUPABASE_URL` — same value as `VITE_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — same value as `VITE_SUPABASE_ANON_KEY`

**Auth persistence:** Uses `@react-native-async-storage/async-storage` (already in package.json) as the Supabase auth storage adapter on native. Web uses default browser storage.

**Image upload in React Native:** Cannot use the `File` Web API. Instead: `fetch(localUri) → response.blob() → supabase.storage.upload(path, blob)`. See `lib/api.ts → uploadMenuImage()`.

**UUID generation:** Uses a custom `generateId()` function (RFC 4122 v4 format via Math.random) instead of the `uuid` package (which crashes on Hermes).

**Why:** The `uuid` package uses Node's crypto module which doesn't exist in React Native's Hermes engine.
