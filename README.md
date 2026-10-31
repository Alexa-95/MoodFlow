# MoodFlow

MoodFlow is a shared-code Expo app for Android, iOS, and the web. It tracks mood,
energy, sleep, and custom numeric habits in a daily pixel calendar. Without
Supabase environment variables, it runs in local demo mode and saves data only
on the current device/browser.

The interface uses [NativeWind](https://www.nativewind.dev/) (Tailwind CSS 3)
classes, shared across native and web targets. Screen and dashboard components
are kept in `src/components/`, and reusable date/heatmap helpers are in
`src/lib/dashboard.ts`.

## Set up cloud accounts and storage

1. Create a free project at [supabase.com](https://supabase.com/). Choose a
   European region if you want the data hosted in Europe. Keep the database
   password private; the app does not need it.
2. In the Supabase dashboard, open **SQL Editor**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates the
   tracker and daily-entry tables and restricts each account to its own rows
   with Row Level Security (RLS).
3. In **Project Settings → API** (or **Connect**), copy the Project URL and the
   publishable key (`sb_publishable_...`). The legacy `anon` key is also usable.
   Never put a `service_role` or secret key in this app.
4. Copy `.env.example` to `.env` in the project root and replace the example
   values:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-key
   ```

5. In Supabase **Authentication → URL Configuration**, add your website URL to
   the allowed redirect URLs before enabling email confirmation. For local web
   development, add `http://localhost:8081/**`. If email confirmation is
   enabled, check the inbox after signing up.
6. Install packages and start the web app:

   ```sh
   npm install
   npm run web
   ```

   For phones, run `npm start` and scan the QR code with Expo Go. Restart Expo
   after changing `.env` so the new values are loaded.
7. Create an account in MoodFlow. Email/password authentication is handled by
   Supabase Auth; entries are stored in the cloud and protected by RLS.

## Run and validate

- `npm start` — Expo development server
- `npm run web` — open the web target
- `npm run typecheck` — TypeScript check
- `npx expo install --check` — verify Expo-compatible package versions

Daily, weekly, monthly, and quarterly views show the last 1, 7, 30, or 90 days.
The pixel color represents the selected metric or an average of the available
metrics for that day.
