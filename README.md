# Farm Connect

Farm Connect is a mobile-first Nigerian agricultural marketplace. Farmers publish structured listings and buyers contact them through private, realtime product conversations. Chat supports text and image messages, and a role-protected admin centre provides marketplace monitoring and moderation.

## Architecture

- `frontend/`: React 19, React Router, TanStack Query, React Hook Form, Tailwind CSS, Supabase Realtime, and an installable PWA service worker.
- `backend/`: Node.js 22 and Express 5 REST API with Zod validation, secure refresh cookies, Sharp image processing, and user-scoped Supabase clients.
- `packages/contracts/`: shared roles, catalog values, Nigerian states, and validation contracts.
- `supabase/`: PostgreSQL schema, RLS policies, triggers, RPC workflows, Storage policies, Realtime publication, and pgTAP tests.

The Supabase service-role key is never used by or exposed to the application. API database calls carry the signed-in user's access token, so PostgreSQL RLS remains authoritative.

## Requirements

- Node.js 22+
- npm 10+
- A Supabase project
- Docker Desktop only when running the full local Supabase stack

## Environment setup

Install dependencies:

```bash
npm install
```

Copy `backend/.env.example` to `backend/.env`:

```dotenv
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
COOKIE_SECRET=use-at-least-32-random-characters
TRUST_PROXY=false
LOG_LEVEL=info
```

Copy `frontend/.env.example` to `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:4000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Only the public Supabase anon key belongs in these files. Never add the service-role key to the frontend or repository.

## Supabase configuration

1. Create a Supabase project and record its project URL and anon key.
2. In Authentication → URL Configuration, set the site URL to the deployed frontend URL and add local/deployed redirect URLs.
3. In Authentication → Providers → Email, enable email/password signup and disable email confirmation for the immediate-access workflow.
4. Link and apply the checked-in migration:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The migration creates both image buckets, all RLS and Storage policies, and Realtime publication entries. Do not recreate those objects manually.

For a Docker-backed local stack:

```bash
npm run db:start
npm run db:reset
npm run db:test
```

The regular test suite also executes the migration and its key security/lifecycle behavior in embedded PostgreSQL, so it does not require Docker.

## Development and verification

```bash
npm run dev
npm run lint
npm test
npm run build
```

The web application runs at `http://localhost:5173`; the API runs at `http://localhost:4000`. The health endpoint is `GET /api/v1/health`.

### PWA and local message notifications

The production frontend build includes a web app manifest, install icons, an offline fallback, and a generated static-asset precache. Service-worker registration is intentionally limited to production builds so development does not retain stale assets. Test the installable build locally with:

```bash
npm run build
npm run preview -w @farm-connect/frontend
```

Open the preview URL in a supported browser and use its **Install Farm Connect** action. Production must use HTTPS; `localhost` is accepted as a secure development context.

Signed-in users can enable local message notifications from the Messages page. Notifications use Supabase Realtime, ignore messages sent by the current user, and are suppressed while the relevant conversation is open. The preference is stored only in that browser. Denying or disabling notifications does not affect chat.

These are local session notifications, not Web Push. Farm Connect must still be open or running as an installed PWA for notifications to arrive; there is no Firebase dependency or closed-app background delivery.

## Production build and deployment

Farm Connect is configured for a **unified monorepo deployment on Vercel** under a single project, routing both frontend and backend through the same domain.

### Vercel Deployment Setup

1. **Deploying to Vercel**:
   - Link the **root** directory of this repository to a new Vercel project.
   - Vercel reads [vercel.json](vercel.json): it builds the frontend via `npm run vercel-build`, serves static assets from `frontend/dist`, and routes all `/api/*` requests to the serverless function at [api/index.js](api/index.js).
   - All other paths fall back to `index.html` so React Router deep links and page refreshes work correctly.

2. **Environment Variables** — set all of these in **Vercel → Project → Settings → Environment Variables** (select all environments: Production, Preview, Development):

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `FRONTEND_URL` | `https://farm-connectng.vercel.app` (your exact deployment URL) |
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_ANON_KEY` | Your Supabase anon/public key |
   | `COOKIE_SECRET` | A random string of **at least 32 characters** |
   | `TRUST_PROXY` | `true` (Vercel sits behind a reverse proxy) |
   | `VITE_API_URL` | `/api/v1` (relative — same domain, no CORS issues) |
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

   > **Important**: `VITE_*` variables are build-time only. They must be set before Vercel runs the build, not just at runtime.

3. **Database Migrations**:
   - Apply the migrations to your production Supabase project **before** deploying:
   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

4. **Supabase Auth Configuration**:
   - In Supabase → Authentication → URL Configuration, add `https://farm-connectng.vercel.app` as the Site URL and in Redirect URLs.

5. **Diagnosing Vercel Function Errors**:
   - Open Vercel → Project → Functions → click the `api/index.js` function → **Logs**.
   - Any missing environment variable or startup crash is logged there with the exact variable name.
   - A `STARTUP_FAILURE` JSON response from any `/api/*` route means an environment variable is missing or invalid.

## Operational notes

- Access tokens live only in browser memory; refresh tokens are Secure, HttpOnly cookies.
- Phone numbers live in `profile_private` and remain owner-only at the table/RLS level. A restricted public-profile RPC exposes a seller’s phone only when that profile is a current Farmer or owns a visible marketplace listing.
- Full name, phone, address, city, state, and profile picture are editable after registration. Public seller profiles display those contact details above active and sold-out listings.
- Conversation responses include a normalized counterpart profile, product context, latest message/time, and unread status. The inbox and chat use those fields for avatar-led conversation rows, fixed chat controls, message timestamps, and role-aware participant profile links.
- Buyer and Farmer conversation-profile cards share the same contact layout. Buyer contact details are available only to authenticated conversation counterparts and omit the Farmer-only listings section.
- Chat images are limited to JPEG, PNG, or WebP source files up to 5 MB. The API decodes them, strips metadata, converts them to WebP, and stores them in the private `chat-media` bucket. Only conversation participants can obtain the short-lived signed image URLs returned by message APIs.
- The admin centre shows user, product, conversation, message, report, and restriction totals. Administrators can inspect product content, review conversations for moderation, process user reports, hide unsafe products, freeze accounts into read-only mode, suspend accounts, restore access, and promote or demote other administrators. Every sensitive change requires a reason and is stored in the admin audit log.
- Administrator access is separate from the Farmer/Buyer marketplace role. Promoting a user never removes their products or changes how they use the marketplace. Admin users are sent to `/admin` after login and can return to the marketplace at any time.
- To bootstrap the first administrator after applying the migrations, run the following once in the Supabase SQL editor with the owner email changed:

  ```sql
  insert into public.admin_memberships (user_id)
  select id from auth.users where lower(email) = lower('owner@example.com')
  on conflict (user_id) do update set revoked_at = null, revoked_by = null;
  ```
- Active and sold-out products remain visible in the public marketplace. Archived products are paused and can be returned directly to active status.
- My Products contains active, sold-out, and archived listings only. Product deletion is permanent from the UI but remains a soft deletion in PostgreSQL so conversation and relational history are preserved.
- A sold-out listing still has public details and may receive new buyer conversations. Archived and deleted listings have no public details.
- Switching from Farmer to Buyer keeps existing listings visible, but disables product creation, editing, image changes, and deletion until the user switches back to Farmer.
- Uploaded images are decoded, metadata-stripped, resized, and converted to WebP before Storage upload.
#   F a r m - C o n n e c t  
 
