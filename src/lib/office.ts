export const OFFICE_OPENED_AT = Date.UTC(2024, 0, 18, 16, 0, 0);

export const TITLES = [
  "Honorary Clerk of the Outer Desk",
  "Provisional Steward of Letterhead",
  "Witness to the Afternoon Light",
  "Keeper of Unused Seals",
  "Correspondent at Large",
  "Friend of the Blotter",
  "Deputy of No Particular Business",
  "Guest of the Empty Chair",
  "Recorder of Quiet Hours",
  "Envoy of the Domain",
] as const;

export const HOLDINGS = [
  {
    name: "Claude",
    klass: "Conversational estate",
    status: "Politely independent",
    note: "Does not report to this office. We remain proud of the acquaintance.",
  },
  {
    name: "Constitutional AI",
    klass: "Doctrine",
    status: "In good standing",
    note: "A set of principles. Not a constitution of this domain, sadly.",
  },
  {
    name: "The Model Spec",
    klass: "Instrument",
    status: "Read annually",
    note: "Filed under things we admire from a careful distance.",
  },
  {
    name: "This Domain",
    klass: "Real property",
    status: "Occupied",
    note: "The one asset we can actually point at. The chair is included.",
  },
] as const;

export type Visitor = {
  name: string;
  remark: string;
  title: string;
  at: string;
  serial: string;
};

export type Decree = {
  text: string;
  at: string;
};

export type OfficeState = {
  visitors: Visitor[];
  decrees: Decree[];
};

const KEY = "anthropic-owner-office-v1";

export function emptyOffice(): OfficeState {
  return { visitors: [], decrees: [] };
}

export function loadOffice(): OfficeState {
  if (typeof window === "undefined") return emptyOffice();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyOffice();
    const parsed = JSON.parse(raw) as Partial<OfficeState>;
    return {
      visitors: Array.isArray(parsed.visitors) ? parsed.visitors.slice(0, 24) : [],
      decrees: Array.isArray(parsed.decrees) ? parsed.decrees.slice(0, 16) : [],
    };
  } catch {
    return emptyOffice();
  }
}

export function saveOffice(state: OfficeState) {
  window.localStorage.setItem(
    KEY,
    JSON.stringify({
      visitors: state.visitors.slice(0, 24),
      decrees: state.decrees.slice(0, 16),
    }),
  );
}

export function makeSerial(name: string, at: Date): string {
  let h = 2166136261;
  const day = `${at.getFullYear()}${String(at.getMonth() + 1).padStart(2, "0")}${String(at.getDate()).padStart(2, "0")}`;
  const s = `${name.trim().toLowerCase()}|${day}`;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const code = (h >>> 0).toString(10).slice(-4).padStart(4, "0");
  return `AO-${at.getFullYear()}-${code}`;
}

export function pickTitle(name: string): string {
  let h = 0;
  const s = name.trim().toLowerCase();
  for (let i = 0; i < s.length; i += 1) {
    h += s.charCodeAt(i) * (i + 3);
  }
  return TITLES[h % TITLES.length] ?? TITLES[0];
}

export function occupancyDays(now: Date): number {
  const ms = Math.max(0, now.getTime() - OFFICE_OPENED_AT);
  return Math.floor(ms / 86_400_000);
}
