# MoodFlow

MoodFlow is a shared-code Expo app for Android, iOS, and the web. It tracks mood,
energy, sleep, and custom numeric, text, or yes/no habits. Numeric and yes/no
values appear in the daily pixel calendar; text answers stay out of the color
scale. Without Supabase environment variables, it runs in local demo mode and
saves data only on the current device/browser.

The interface uses [NativeWind](https://www.nativewind.dev/) (Tailwind CSS 3)
classes, shared across native and web targets. Screen and dashboard components
are kept in `src/components/`, and reusable date/heatmap helpers are in
`src/lib/dashboard.ts`.

The web app is exported as static assets and served by a Cloudflare Worker.
Supabase remains the authentication and database service; no separate Worker
API is required.

## Set up cloud accounts and storage

1. Create a free project at [supabase.com](https://supabase.com/). Choose a
   European region if you want the data hosted in Europe. Keep the database
   password private; the app does not need it.
2. In the Supabase dashboard, open **SQL Editor**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates the
   tracker and daily-entry tables, adds the tracker value type to an existing
   table if needed, and restricts each account to its own rows with Row Level
   Security (RLS). If your tables already exist, run the updated SQL script
   again to add the new tracker type column and update the mood/energy ranges.
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
- `npm run build` — export the website into `dist/`
- `npm run preview` — preview the Worker locally
- `npm run deploy` — deploy the website to Cloudflare Workers
- `npm run typecheck` — TypeScript check
- `npx expo install --check` — verify Expo-compatible package versions

## Deploy the website to Cloudflare Workers

1. Push this project to GitHub and create a Worker from the repository using
   **Workers Builds**.
2. Set the build command to `npm run build`. Leave the build output directory
   empty; `wrangler.jsonc` points the Worker to Expo's `dist/` output.
3. Keep the deploy command as `npx wrangler deploy`. Set the preview command to
   `npx wrangler dev`.
4. Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` as
   **build-time environment variables** in the Cloudflare build settings. Expo
   embeds these `EXPO_PUBLIC_` values into the web bundle during the build.
   The Supabase publishable/legacy `anon` key is meant to be public; never
   configure a `service_role` or secret key here.
5. Add the deployed `workers.dev` address (and any custom domain) to Supabase
   **Authentication → URL Configuration → Redirect URLs**, and run the
   `supabase/schema.sql` setup script in the Supabase SQL Editor if not already
   applied.
6. Deploy. Changes to the Supabase build variables require a fresh deployment.

Daily, weekly, monthly, and quarterly views show a day, Monday-to-Sunday week,
calendar month, or rolling 90-day period. Mood is measured from -5 to 5 and
energy from 1 to 10. The pixel color represents the selected numeric or yes/no
metric, or an average of available numeric and yes/no metrics for that day.
Text values are excluded.
