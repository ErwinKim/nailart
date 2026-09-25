# NailArt

## Supabase auth setup

1. Copy `.env.local.example` to `.env.local` and add the Supabase publishable or anon key.
2. In Supabase Dashboard, enable Google under Authentication > Providers.
3. Add `http://localhost:3000/auth/callback` to the provider redirect URLs.
4. Add the production callback URL with the same `/auth/callback` path before deploying.

The `public.users` profile table is synchronized automatically from `auth.users` by a database trigger. The app exposes the current auth state through `AuthProvider` and `useAuth`.