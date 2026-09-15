import {
  get,
  increment,
  limitToLast,
  onDisconnect,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  remove,
  set,
  update,
  type DataSnapshot,
} from "firebase/database";
import { z } from "zod";
import { anonymousUser, realtimeDatabase } from "@/lib/firebase";
import { makeSerial, pickTitle } from "@/lib/office";

const audienceSchema = z.object({
  name: z.string().trim().min(2).max(48),
  remark: z.string().trim().max(140).optional().default(""),
});
const decreeSchema = z.object({ text: z.string().trim().min(4).max(160) });

export type LedgerAudience = {
  name: string;
  remark: string;
  title: string;
  serial: string;
  at: string;
};
export type LedgerDecree = { text: string; at: string };
export type DayPoint = { day: string; views: number; uniques: number };
export type Dashboard = {
  online: number;
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

let trackingPromise: Promise<() => void> | null = null;
let presenceSessionId: string | null = null;
let pageViewRecorded = false;

function sessionId(): string {
  presenceSessionId ??= window.crypto.randomUUID();
  return presenceSessionId;
}

function dateKeys(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  return { day, month: day.slice(0, 7), year: day.slice(0, 4) };
}

/** Start one presence session per tab and count one view per full page load. */
export function startVisitorTracking(): Promise<() => void> {
  if (trackingPromise) return trackingPromise;
  trackingPromise = (async () => {
    const user = await anonymousUser();
    const db = realtimeDatabase();
    const id = sessionId();
    const presenceRef = ref(db, `presence/${id}`);
    const connectedRef = ref(db, ".info/connected");
    let cancelled = false;

    const unsubscribe = onValue(connectedRef, async (snapshot) => {
      if (snapshot.val() !== true || cancelled) return;
      await onDisconnect(presenceRef).remove();
      if (!cancelled) {
        await set(presenceRef, {
          uid: user.uid,
          connectedAt: { ".sv": "timestamp" },
        });
      }
    });

    if (!pageViewRecorded) {
      const { day, month, year } = dateKeys();
      await update(ref(db), {
        "analytics/totalViews": increment(1),
        [`analytics/days/${day}/views`]: increment(1),
        [`analytics/months/${month}/views`]: increment(1),
        [`analytics/years/${year}/views`]: increment(1),
        [`analytics/uniqueVisitors/${user.uid}`]: true,
        [`analytics/days/${day}/visitors/${user.uid}`]: true,
        [`analytics/months/${month}/visitors/${user.uid}`]: true,
        [`analytics/years/${year}/visitors/${user.uid}`]: true,
      });
      pageViewRecorded = true;
    }

    return () => {
      cancelled = true;
      unsubscribe();
      void onDisconnect(presenceRef).cancel();
      void remove(presenceRef);
      trackingPromise = null;
    };
  })().catch((error) => {
    trackingPromise = null;
    throw error;
  });
  return trackingPromise;
}

export async function createAudience(input: unknown): Promise<LedgerAudience> {
  const data = audienceSchema.parse(input);
  await anonymousUser();
  const at = new Date();
  const row: LedgerAudience = {
    name: data.name,
    remark: data.remark,
    title: pickTitle(data.name),
    serial: makeSerial(data.name, at),
    at: at.toISOString(),
  };
  await set(push(ref(realtimeDatabase(), "office/audiences")), row);
  return row;
}

export async function createDecree(input: unknown): Promise<LedgerDecree> {
  const data = decreeSchema.parse(input);
  await anonymousUser();
  const row = { text: data.text, at: new Date().toISOString() };
  await set(push(ref(realtimeDatabase(), "office/decrees")), row);
  return row;
}

function rows<T>(snapshot: DataSnapshot): T[] {
  const value = snapshot.val() as Record<string, T> | null;
  return value ? Object.values(value).reverse() : [];
}

export async function getPublicLedger() {
  await anonymousUser();
  const db = realtimeDatabase();
  const [audiences, decrees] = await Promise.all([
    get(query(ref(db, "office/audiences"), orderByChild("at"), limitToLast(24))),
    get(query(ref(db, "office/decrees"), orderByChild("at"), limitToLast(16))),
  ]);
  return {
    audiences: rows<LedgerAudience>(audiences),
    decrees: rows<LedgerDecree>(decrees),
  };
}

function countChildren(value: unknown): number {
  return value && typeof value === "object" ? Object.keys(value).length : 0;
}

function lastFourteenDays(): string[] {
  const days: string[] = [];
  const now = new Date();
  const utc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (let i = 13; i >= 0; i -= 1) {
    days.push(new Date(utc - i * 86_400_000).toISOString().slice(0, 10));
  }
  return days;
}

/** Subscribe to the existing dashboard data without changing its visual design. */
export function subscribeDashboard(
  listener: (data: Dashboard) => void,
  onError: (error: Error) => void,
): () => void {
  let cancelled = false;
  let unsubscribers: Array<() => void> = [];
  let analytics: Record<string, any> = {};
  let presence: Record<string, unknown> = {};
  let office: Record<string, any> = {};
  const publish = () => {
    const keys = dateKeys();
    listener({
      online: countChildren(presence),
      viewsToday: Number(analytics.days?.[keys.day]?.views ?? 0),
      viewsMonth: Number(analytics.months?.[keys.month]?.views ?? 0),
      viewsYear: Number(analytics.years?.[keys.year]?.views ?? 0),
      viewsAll: Number(analytics.totalViews ?? 0),
      uniqueToday: countChildren(analytics.days?.[keys.day]?.visitors),
      uniqueMonth: countChildren(analytics.months?.[keys.month]?.visitors),
      uniqueYear: countChildren(analytics.years?.[keys.year]?.visitors),
      uniqueAll: countChildren(analytics.uniqueVisitors),
      series: lastFourteenDays().map((day) => ({
        day,
        views: Number(analytics.days?.[day]?.views ?? 0),
        uniques: countChildren(analytics.days?.[day]?.visitors),
      })),
      audiences: (Object.values(office.audiences ?? {}) as LedgerAudience[])
        .reverse()
        .slice(0, 50),
      decrees: (Object.values(office.decrees ?? {}) as LedgerDecree[])
        .reverse()
        .slice(0, 50),
    });
  };
  const fail = (error: Error) => onError(error);
  void anonymousUser()
    .then(() => {
      if (cancelled) return;
      const db = realtimeDatabase();
      unsubscribers = [
        onValue(ref(db, "analytics"), (snap) => {
          analytics = snap.val() ?? {};
          publish();
        }, fail),
        onValue(ref(db, "presence"), (snap) => {
          presence = snap.val() ?? {};
          publish();
        }, fail),
        onValue(ref(db, "office"), (snap) => {
          office = snap.val() ?? {};
          publish();
        }, fail),
      ];
    })
    .catch(fail);
  return () => {
    cancelled = true;
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}
