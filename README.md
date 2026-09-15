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
| `DATABASE_URL` | For live counts | Neon / Postgres connection string. Without it, visitor totals do not persist. |

Firebase keys are not used by this app. After adding env vars, redeploy.


## Stack

TanStack Start, React 19, Tailwind CSS v4, Nitro (Vercel preset).
