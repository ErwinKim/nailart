# NailArt

## Supabase auth setup

1. Copy `.env.local.example` to `.env.local` and add the Supabase publishable or anon key.
2. In Supabase Dashboard, enable Google under Authentication > Providers.
3. Add `http://localhost:3000/auth/callback` to the provider redirect URLs.
4. Add the production callback URL with the same `/auth/callback` path before deploying.

The `public.users` profile table is synchronized automatically from `auth.users` by a database trigger. The app exposes the current auth state through `AuthProvider` and `useAuth`.

## Thumbnail generation

The dashboard PromptArea sends prompts and optional PNG, JPEG, WebP, or GIF reference images to `POST /api/thumbnails`. The server generates a 16:9 image with Gemini Nano Banana Pro (`gemini-3-pro-image-preview`), uploads it to the private Supabase `image` bucket, and saves its storage path and prompt in `public.thumbnails`.

Set `GEMINI_API_KEY` in `.env.local` as a server-only variable. Do not prefix it with `NEXT_PUBLIC_` or expose it in browser code. The key is already configured locally for this workspace.