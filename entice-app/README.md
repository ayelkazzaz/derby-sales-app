# Entice — Couple OS

Production build of the Entice prototype: real accounts (email + password), backed by Supabase, with privacy enforced at the database level via Row-Level Security and three RPC functions. All 14 features from the prototype are wired to real persistence — nothing here is a fake button.

This README covers the parts you have to do yourself (creating your own Supabase project and hosting account) and how the code here maps to the build brief.

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Open **SQL Editor**, paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it. It has not been executed against a live database before — if anything throws a syntax error, fix it in place (these should be minor) and re-run.
3. Under **Authentication → Providers**, confirm Email/Password is enabled (it's on by default). For faster local testing you can disable "Confirm email" under **Authentication → Settings**, and re-enable it before any real launch.
4. Under **Database → Replication**, enable Realtime on the `couples` table only. Every trigger in the schema bumps `couples.updated_at` whenever couple-scoped data changes, so subscribing to that one table is enough for clients to know "something changed, go refetch" — without ever broadcasting privacy-sensitive row content directly.
5. Copy the **Project URL** and **anon public API key** from **Settings → API**.

## 2. Configure and run locally

```bash
cd entice-app
npm install
cp .env.example .env.local
# edit .env.local with your Project URL and anon key
npm run dev
```

Open two browser profiles (or a normal + incognito window) to test pairing between two accounts on one machine.

## 3. Deploy

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. Connect the repo to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) — both are free-tier friendly and auto-deploy on push. Point the project's root directory at `entice-app/` (this is a subfolder of the repo, not the repo root).
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the hosting dashboard, using the same values from `.env.local`.
4. Build command: `npm run build`. Output directory: `dist`.

## 4. Test the privacy model, not just the UI

Test with two real accounts, ideally on two real devices:

1. Sign up both accounts, pair them with an invite code (Tonight → Create Our Space / I have a code).
2. Confirm mood sync: set a mood on one device, confirm it appears on the other within a few seconds (via the Realtime subscription on `couples`).
3. Open browser dev tools → Network tab on one account, and:
   - Fill out **Couple DNA** on both accounts, then open the DNA screen again and inspect the network responses. You should only ever see `get_dna_view` RPC responses (my_value / partner_value pairs) — never a raw `dna_answers` row for the partner's `user_id`.
   - Make **Secret Match** picks on both accounts. Inspect network responses — you should only ever see matched `option_key` values from `get_secret_matches`, never the partner's one-sided picks.
   - In **Repair Mode**, leave some fields unshared on one account, and confirm `get_repair_reflection` returns `null` for those fields when read from the other account.

If any of those checks show raw partner data, that's a real bug — the same bar the prototype held itself to ("no dead buttons, no fake functionality") applies here to the privacy model, not just the UI.

## How the prototype maps to this codebase

| Prototype (temporary, `window.storage`) | Here |
|---|---|
| `useCoupleStorage` polling | `src/hooks/useCouple.ts` (pairing/role/realtime) + per-feature fetches in `src/lib/data.ts` |
| Manual invite create/join | `create_couple_space()` / `redeem_invite()` RPCs, called from `useCouple` |
| Secret Match reveal | `get_secret_matches()` RPC |
| Couple DNA combined theme | `get_dna_view()` RPC, fed into the same `combinedTheme()` / `DNA_LABELS` helpers from the prototype (`src/lib/content.ts`), unchanged |
| Repair Mode reflect step | `get_repair_reflection()` RPC — server nulls unshared fields |
| Everything else (games, decks, vault, dreams, consent, achievements) | Plain `select`/`insert`/`update`/`upsert` calls in `src/lib/data.ts`; RLS alone enforces per-couple access |
| `Onboarding` (name only, resets on refresh) | `src/components/Auth.tsx` — real email/password sign-up & sign-in via `supabase.auth`, with a `profiles` row created on first session |

**Solo (unpaired) mode**: in the prototype, features worked before pairing but never persisted (`useCoupleStorage`'s `save()` was a no-op without a `coupleId`, and the Onboarding screen said as much: "this resets on refresh"). Every table in the schema is couple-scoped by design, so this codebase preserves that same behavior exactly: unpaired users can still play the local games and browse everything, but nothing is written to Supabase until you pair. Pairing is what turns the app from a local demo into a real, persisted shared space.

**After Dark's two-layer gate**: `consent_settings.after_dark_confirmed_a` / `_b` are the persistent, per-partner opt-in (toggled in Consent Center, one column per partner) — both must be `true` before the After Dark screen unlocks at all. On top of that, the After Dark screen itself asks for a fresh confirmation checkbox from both partners on every visit, exactly like the prototype.

## Out of scope for this phase

Push notifications, native App Store/Play Store packaging, and payment integration are later phases, once this core backend is proven with real users.
