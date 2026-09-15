# The Anthropic Owner

Ceremonial office for [anthropicowner.com](https://anthropicowner.com).

We do not operate the laboratory. We keep the chair warm, the blotter straight, and the domain from going to waste.

A parody site. Not affiliated with Anthropic PBC, its employees, or its models.

## Deploy on Vercel

1. Import this GitHub repository in [Vercel](https://vercel.com/new).
2. Framework preset: **Other**
3. Build command: `npm run build`
4. Node.js version: **22.x**
5. Add the custom domain `anthropicowner.com` under Project → Settings → Domains.

Environment variables (Project → Settings → Environment Variables):

| Name | Required | Purpose |
| --- | --- | --- |
| `ADMIN_ID` | Yes | Identity for `/admin` |
| `ADMIN_PASSWORD` | Yes | Password for `/admin` |
| `ADMIN_SECRET` | Optional | Signs the admin session cookie. Defaults to `ADMIN_PASSWORD`. |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase Auth domain, usually `<project-id>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_DATABASE_URL` | Yes | Realtime Database URL |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase web app ID |

`DATABASE_URL` is no longer used or required. The site has no Postgres, Neon,
PGLite, SQL migration, or deploy-time database step.

## Firebase Realtime Database setup

1. In Firebase Console, open **Project settings → General** and create/select a
   Web app. Copy the corresponding values into the five `VITE_FIREBASE_*`
   variables above in Vercel. These Firebase web config values identify the app;
   they are not server secrets.
2. Open **Build → Realtime Database**, create a database, then copy its URL from
   the top of the **Data** tab (for example,
   `https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app`). Use
   that exact value for `VITE_FIREBASE_DATABASE_URL`.
3. Open **Build → Authentication → Sign-in method** and enable **Anonymous**.
   Analytics writes and presence sessions are limited to authenticated anonymous
   Firebase users by the rules.
4. Open **Realtime Database → Rules**, paste the complete contents of
   [`database.rules.json`](database.rules.json), and publish the rules.
5. Add the environment variables to Vercel for Production (and Preview if
   wanted), then redeploy. Do not commit a real `.env` file.

The database layout is:

```text
analytics/
  totalViews
  uniqueVisitors/<firebase-uid>
  days/<YYYY-MM-DD>/{views,visitors}
  months/<YYYY-MM>/{views,visitors}
  years/<YYYY>/{views,visitors}
presence/<tab-session-id>/{uid,connectedAt}
office/{audiences,decrees}/<generated-id>
```

View counters use Firebase atomic increments. One page view is recorded per full
page load, so React re-renders do not add views. Presence uses one stable session
ID per tab and Firebase `onDisconnect()` cleanup, with an immediate cleanup on a
normal unmount as well. The admin dashboard subscribes to Firebase and updates
without polling.

The supplied rules deny access by default, restrict writes to the paths and
shapes used above, and ensure visitors can only create/delete their own presence
record. Client-side analytics can still be intentionally spammed by a determined
user; enable Firebase App Check if abuse becomes a concern.


## Stack

TanStack Start, React 19, Tailwind CSS v4, Nitro (Vercel preset).
