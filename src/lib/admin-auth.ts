import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const COOKIE = "ao_ledger_session";
const loginSchema = z.object({
  id: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200),
});

async function same(left: string, right: string): Promise<boolean> {
  const { timingSafeEqual } = await import("node:crypto");
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  const size = Math.max(a.length, b.length, 1);
  const aa = Buffer.alloc(size);
  const bb = Buffer.alloc(size);
  a.copy(aa);
  b.copy(bb);
  return a.length === b.length && timingSafeEqual(aa, bb);
}

function credentials(): { id: string; password: string } | null {
  const id = process.env.ADMIN_ID?.trim() ?? "";
  const password = process.env.ADMIN_PASSWORD?.trim() ?? "";
  if (id && password) return { id, password };
  if (!process.env.VERCEL) return { id: "owner", password: "blotter" };
  return null;
}

function signingKey() {
  const raw = (
    process.env.ADMIN_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "preview-anthropic-owner-ledger"
  ).padEnd(32, "#");
  return new TextEncoder().encode(raw);
}

export async function readAdminSession(): Promise<string | null> {
  const { getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie(COOKIE);
  if (!token) return null;
  try {
    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(token, signingKey());
    const sub = typeof payload.sub === "string" ? payload.sub : "";
    return sub || null;
  } catch {
    return null;
  }
}

async function writeAdminSession(id: string) {
  const { SignJWT } = await import("jose");
  const token = await new SignJWT({ sub: id })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(signingKey());
  const { setCookie } = await import("@tanstack/react-start/server");
  setCookie(COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: Boolean(process.env.VERCEL),
    maxAge: 60 * 60 * 24 * 7,
  });
}

async function clearAdminSession() {
  const { setCookie } = await import("@tanstack/react-start/server");
  setCookie(COOKIE, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: Boolean(process.env.VERCEL),
    maxAge: 0,
  });
}

export const getAdminSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const id = await readAdminSession();
    return id ? ({ signedIn: true as const, id } as const) : ({ signedIn: false as const } as const);
  },
);

export const loginAdmin = createServerFn({ method: "POST" })
  .validator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const creds = credentials();
    if (!creds) return { ok: false as const, reason: "unset" as const };
    if (!(await same(data.id, creds.id)) || !(await same(data.password, creds.password))) {
      return { ok: false as const, reason: "invalid" as const };
    }
    await writeAdminSession(creds.id);
    return { ok: true as const, id: creds.id };
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  await clearAdminSession();
  return { ok: true as const };
});
