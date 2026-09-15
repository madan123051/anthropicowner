import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Crest } from "@/components/crest";
import { getDashboard, type Dashboard } from "@/lib/office-server";
import { cn } from "@/lib/utils";

export function AdminPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const next = await getDashboard();
        if (cancelled) return;
        setData(next);
        setError(null);
        setUpdatedAt(new Date());
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "The ledger did not answer.");
      }
    }
    void tick();
    const id = window.setInterval(() => void tick(), 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-fg/10 bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 text-fg">
            <Crest className="size-8" />
            <span className="font-display text-lg leading-none">Office ledger</span>
          </Link>
          <p className="flex items-center gap-2 text-xs text-muted">
            <span
              className="size-1.5 rounded-full bg-accent"
              aria-hidden
            />
            <span className="tabular-nums">
              {updatedAt ? `Live · ${format(updatedAt, "HH:mm:ss")}` : "Connecting"}
            </span>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <p className="font-sans text-xs tracking-widest text-muted uppercase">
          Administration
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
          Who has come to the desk
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          Unique visitors and page views, with the ceremonial roll and
          minute-book. Figures refresh every ten seconds.
        </p>

        {error ? (
          <p className="mt-8 text-sm text-muted" role="status">
            {error}
          </p>
        ) : null}

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Today"
            people={data?.uniqueToday ?? null}
            views={data?.viewsToday ?? null}
          />
          <StatCard
            label="This month"
            people={data?.uniqueMonth ?? null}
            views={data?.viewsMonth ?? null}
          />
          <StatCard
            label="This year"
            people={data?.uniqueYear ?? null}
            views={data?.viewsYear ?? null}
          />
        </section>
        <p className="mt-3 text-sm text-muted tabular-nums">
          All time · {data ? data.uniqueAll : "—"}{" "}
          {data?.uniqueAll === 1 ? "person" : "people"} · {data ? data.viewsAll : "—"}{" "}
          {data?.viewsAll === 1 ? "view" : "views"}
        </p>

        <section className="mt-12">
          <h2 className="font-display text-2xl">Last fourteen days</h2>
          <div className="mt-4 h-64 rounded-xl border border-fg/10 bg-surface p-4 sm:p-6">
            {data ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.series} barGap={2}>
                  <XAxis
                    dataKey="day"
                    tickFormatter={(value: string) => value.slice(5)}
                    tick={{ fill: "currentColor", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "currentColor", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    cursor={{ fill: "color-mix(in oklab, var(--color-fg) 6%, transparent)" }}
                    contentStyle={{
                      background: "var(--color-bg)",
                      border: "1px solid color-mix(in oklab, var(--color-fg) 12%, transparent)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="uniques" name="People" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="views" name="Views" fill="var(--color-muted)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="grid h-full place-items-center text-sm text-muted">
                Counting the afternoon light…
              </p>
            )}
          </div>
        </section>

        <section className="mt-16 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl">Desk · audiences</h2>
            <p className="mt-2 text-sm text-muted">Names as they were written at the blotter.</p>
            {data && data.audiences.length === 0 ? (
              <p className="mt-6 text-sm text-muted">No audiences recorded yet.</p>
            ) : (
              <ul className="mt-6 divide-y divide-fg/10 border-y border-fg/10">
                {(data?.audiences ?? []).map((row) => (
                  <li key={`${row.serial}-${row.at}`} className="py-4">
                    <p className="font-medium">{row.name}</p>
                    <p className="text-sm text-muted">{row.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {row.remark || "No remark offered."}
                    </p>
                    <p className="mt-2 text-xs text-muted tabular-nums">
                      {row.serial} · {format(new Date(row.at), "d MMM yyyy · HH:mm")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="font-display text-2xl">Registry · decrees</h2>
            <p className="mt-2 text-sm text-muted">Lines entered in the minute-book.</p>
            {data && data.decrees.length === 0 ? (
              <p className="mt-6 text-sm text-muted">The minute-book is blank.</p>
            ) : (
              <ul className="mt-6 divide-y divide-fg/10 border-y border-fg/10">
                {(data?.decrees ?? []).map((row) => (
                  <li key={row.at + row.text} className="py-4">
                    <p className="font-display text-xl leading-snug">{row.text}</p>
                    <p className="mt-2 text-xs text-muted tabular-nums">
                      {format(new Date(row.at), "d MMM yyyy · HH:mm")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  people,
  views,
}: {
  label: string;
  people: number | null;
  views: number | null;
}) {
  return (
    <article className={cn("rounded-xl border border-fg/10 bg-surface p-5 sm:p-6")}>
      <p className="text-xs tracking-widest text-muted uppercase">{label}</p>
      <p className="mt-3 font-display text-4xl tabular-nums leading-none">
        {people === null ? "—" : people}
      </p>
      <p className="mt-2 text-sm text-muted">
        {people === 1 ? "person" : "people"}
        <span className="text-fg/30"> · </span>
        <span className="tabular-nums">{views === null ? "—" : views}</span>{" "}
        {views === 1 ? "view" : "views"}
      </p>
    </article>
  );
}
