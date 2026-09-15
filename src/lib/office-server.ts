import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { makeSerial, pickTitle } from "@/lib/office";

const visitorIdSchema = z.object({
  visitorId: z.string().min(8).max(80),
});

const audienceSchema = z.object({
  name: z.string().trim().min(2).max(48),
  remark: z.string().trim().max(140).optional().default(""),
});

const decreeSchema = z.object({
  text: z.string().trim().min(4).max(160),
});

function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return new Date(value).toISOString();
  return new Date().toISOString();
}

function asCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export type LedgerAudience = {
  name: string;
  remark: string;
  title: string;
  serial: string;
  at: string;
};

export type LedgerDecree = {
  text: string;
  at: string;
};

export type DayPoint = {
  day: string;
  views: number;
  uniques: number;
};

export type Dashboard = {
  viewsToday: number;
  viewsMonth: number;
  viewsYear: number;
  viewsAll: number;
  uniqueToday: number;
  uniqueMonth: number;
  uniqueYear: number;
  uniqueAll: number;
  series: DayPoint[];
  audiences: LedgerAudience[];
  decrees: LedgerDecree[];
};

export const recordVisit = createServerFn({ method: "POST" })
  .validator((data: unknown) => visitorIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`insert into page_views (visitor_id) values (${data.visitorId})`;
    return { ok: true as const };
  });

export const createAudience = createServerFn({ method: "POST" })
  .validator((data: unknown) => audienceSchema.parse(data))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const at = new Date();
    const title = pickTitle(data.name);
    const serial = makeSerial(data.name, at);
    const remark = data.remark ?? "";
    const rows = await sql<{
      name: string;
      remark: string;
      title: string;
      serial: string;
      created_at: unknown;
    }>`
      insert into audiences (name, remark, title, serial)
      values (${data.name}, ${remark}, ${title}, ${serial})
      returning name, remark, title, serial, created_at
    `;
    const row = rows[0];
    if (!row) {
      return { name: data.name, remark, title, serial, at: at.toISOString() };
    }
    return {
      name: row.name,
      remark: row.remark,
      title: row.title,
      serial: row.serial,
      at: asIso(row.created_at),
    };
  });

export const createDecree = createServerFn({ method: "POST" })
  .validator((data: unknown) => decreeSchema.parse(data))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ body: string; created_at: unknown }>`
      insert into decrees (body) values (${data.text})
      returning body, created_at
    `;
    const row = rows[0];
    return {
      text: row?.body ?? data.text,
      at: asIso(row?.created_at),
    };
  });

export const getPublicLedger = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const audienceRows = await sql<{
      name: string;
      remark: string;
      title: string;
      serial: string;
      created_at: unknown;
    }>`
      select name, remark, title, serial, created_at
      from audiences
      order by created_at desc
      limit 24
    `;
    const decreeRows = await sql<{ body: string; created_at: unknown }>`
      select body, created_at
      from decrees
      order by created_at desc
      limit 16
    `;
    return {
      audiences: audienceRows.map((row) => ({
        name: row.name,
        remark: row.remark,
        title: row.title,
        serial: row.serial,
        at: asIso(row.created_at),
      })),
      decrees: decreeRows.map((row) => ({
        text: row.body,
        at: asIso(row.created_at),
      })),
    };
  },
);

export const getDashboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ ok: false } | { ok: true; data: Dashboard }> => {
    const { readAdminSession } = await import("@/lib/admin-auth");
    const session = await readAdminSession();
    if (!session) return { ok: false };

    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const stats = await sql<{
      views_today: unknown;
      views_month: unknown;
      views_year: unknown;
      views_all: unknown;
      unique_today: unknown;
      unique_month: unknown;
      unique_year: unknown;
      unique_all: unknown;
    }>`
      select
        count(*) filter (where created_at >= date_trunc('day', now())) as views_today,
        count(*) filter (where created_at >= date_trunc('month', now())) as views_month,
        count(*) filter (where created_at >= date_trunc('year', now())) as views_year,
        count(*) as views_all,
        count(distinct visitor_id) filter (where created_at >= date_trunc('day', now())) as unique_today,
        count(distinct visitor_id) filter (where created_at >= date_trunc('month', now())) as unique_month,
        count(distinct visitor_id) filter (where created_at >= date_trunc('year', now())) as unique_year,
        count(distinct visitor_id) as unique_all
      from page_views
    `;
    const s = stats[0];
    const seriesRows = await sql<{
      day: string;
      views: unknown;
      uniques: unknown;
    }>`
      select
        created_at::date as day,
        count(*) as views,
        count(distinct visitor_id) as uniques
      from page_views
      where created_at >= now() - interval '13 days'
      group by 1
      order by 1
    `;
    const byDay = new Map(
      seriesRows.map((row) => [
        String(row.day).slice(0, 10),
        { views: asCount(row.views), uniques: asCount(row.uniques) },
      ]),
    );
    const audienceRows = await sql<{
      name: string;
      remark: string;
      title: string;
      serial: string;
      created_at: unknown;
    }>`
      select name, remark, title, serial, created_at
      from audiences
      order by created_at desc
      limit 50
    `;
    const decreeRows = await sql<{ body: string; created_at: unknown }>`
      select body, created_at
      from decrees
      order by created_at desc
      limit 50
    `;
    return {
      ok: true,
      data: {
        viewsToday: asCount(s?.views_today),
        viewsMonth: asCount(s?.views_month),
        viewsYear: asCount(s?.views_year),
        viewsAll: asCount(s?.views_all),
        uniqueToday: asCount(s?.unique_today),
        uniqueMonth: asCount(s?.unique_month),
        uniqueYear: asCount(s?.unique_year),
        uniqueAll: asCount(s?.unique_all),
        series: lastFourteenDays().map((day) => ({
          day,
          views: byDay.get(day)?.views ?? 0,
          uniques: byDay.get(day)?.uniques ?? 0,
        })),
        audiences: audienceRows.map((row) => ({
          name: row.name,
          remark: row.remark,
          title: row.title,
          serial: row.serial,
          at: asIso(row.created_at),
        })),
        decrees: decreeRows.map((row) => ({
          text: row.body,
          at: asIso(row.created_at),
        })),
      },
    };
  },
);

function lastFourteenDays(): string[] {
  const days: string[] = [];
  const now = new Date();
  const utc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (let i = 13; i >= 0; i -= 1) {
    days.push(new Date(utc - i * 86_400_000).toISOString().slice(0, 10));
  }
  return days;
}
