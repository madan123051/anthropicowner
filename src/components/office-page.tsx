import { format } from "date-fns";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Crest } from "@/components/crest";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  HOLDINGS,
  loadOffice,
  makeSerial,
  occupancyDays,
  pickTitle,
  saveOffice,
  type Decree,
  type Visitor,
} from "@/lib/office";
import { cn } from "@/lib/utils";

export function OfficePage() {
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [name, setName] = useState("");
  const [remark, setRemark] = useState("");
  const [decree, setDecree] = useState("");
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [decrees, setDecrees] = useState<Decree[]>([]);
  const [stampedName, setStampedName] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [decreeNotice, setDecreeNotice] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadOffice();
    setVisitors(saved.visitors);
    setDecrees(saved.decrees);
    setReady(true);
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveOffice({ visitors, decrees });
  }, [visitors, decrees, ready]);

  const trimmed = name.trim();
  const previewDate = now ?? new Date(0);
  const serial = useMemo(
    () => (trimmed ? makeSerial(trimmed, previewDate) : "AO-————-————"),
    [trimmed, previewDate],
  );
  const title = trimmed ? pickTitle(trimmed) : "Title to be assigned";
  const stamped = Boolean(stampedName && stampedName === trimmed);
  const days = now ? occupancyDays(now) : null;

  function recordAudience(event: FormEvent) {
    event.preventDefault();
    if (trimmed.length < 2) {
      setNotice("A name of at least two letters, if you please.");
      return;
    }
    const at = new Date();
    const visitor: Visitor = {
      name: trimmed,
      remark: remark.trim(),
      title: pickTitle(trimmed),
      at: at.toISOString(),
      serial: makeSerial(trimmed, at),
    };
    setVisitors((prev) => [visitor, ...prev].slice(0, 24));
    setStampedName(trimmed);
    setNotice("Audience recorded. The seal is dry.");
    setRemark("");
  }

  function enterDecree(event: FormEvent) {
    event.preventDefault();
    const text = decree.trim();
    if (text.length < 4) {
      setDecreeNotice("A decree needs at least a sentence.");
      return;
    }
    const entry: Decree = { text, at: new Date().toISOString() };
    setDecrees((prev) => [entry, ...prev].slice(0, 16));
    setDecree("");
    setDecreeNotice("Entered in the minute-book. Enforcement is not among our duties.");
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <a
        href="#desk"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-bg"
      >
        Skip to the desk
      </a>
      <Header now={now} days={days} />
      <main>
        <Hero />
        <StudyPhoto />
        <Manifesto />
        <Holdings />
        <Desk
          name={name}
          remark={remark}
          serial={serial}
          title={title}
          stamped={stamped}
          notice={notice}
          now={now}
          onName={setName}
          onRemark={setRemark}
          onSubmit={recordAudience}
        />
        <Registry visitors={visitors} />
        <Decrees
          value={decree}
          onChange={setDecree}
          onSubmit={enterDecree}
          entries={decrees}
          notice={decreeNotice}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

function Header({ now, days }: { now: Date | null; days: number | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-fg/10 bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5 text-fg">
          <Crest className="size-8" />
          <span className="font-display text-lg leading-none">
            <span className="sm:hidden">Owner</span>
            <span className="hidden sm:inline">The Anthropic Owner</span>
          </span>
        </a>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <NavLink href="#holdings">Holdings</NavLink>
          <NavLink href="#desk">Desk</NavLink>
          <NavLink href="#registry">Registry</NavLink>
        </nav>
        <p className="hidden min-w-28 text-right font-sans text-xs text-muted tabular-nums md:block">
          <span className="block tracking-wide uppercase">Desk clock</span>
          <span className="text-fg">
            {now ? format(now, "HH:mm:ss") : "——:——:——"}
          </span>
          {days !== null ? (
            <span className="mt-0.5 block">Day {days}</span>
          ) : null}
        </p>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className="inline-flex h-11 items-center rounded-md px-2.5 text-muted transition-colors duration-150 hover:text-fg sm:px-3"
    >
      {children}
    </a>
  );
}

function Hero() {
  return (
    <section id="top" className="mx-auto max-w-6xl px-5 pb-10 pt-14 sm:px-8 sm:pt-20">
      <p className="rise font-sans text-xs tracking-widest text-muted uppercase">
        anthropicowner.com · a ceremonial office
      </p>
      <h1 className="rise rise-2 mt-5 max-w-3xl font-display text-5xl leading-[1.05] tracking-tight text-fg sm:text-6xl lg:text-7xl">
        The Office of the Anthropic Owner
      </h1>
      <p className="rise rise-3 mt-6 max-w-xl text-lg text-muted">
        We do not operate the laboratory. We keep the chair warm, the blotter
        straight, and the domain from going to waste.
      </p>
      <div className="rise rise-4 mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <a href="#desk">Record an audience</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="#holdings">View holdings</a>
        </Button>
      </div>
    </section>
  );
}

function StudyPhoto() {
  return (
    <figure className="mx-auto max-w-6xl px-5 sm:px-8">
      <img
        src="/images/study.jpg"
        alt="An empty wood-paneled study in late afternoon, a mahogany desk waiting under warm window light."
        width={1792}
        height={1008}
        className="aspect-video w-full rounded-xl object-cover"
        fetchPriority="high"
        decoding="async"
      />
      <figcaption className="mt-3 text-sm text-muted">
        The desk, unoccupied. The work, accordingly, is light.
      </figcaption>
    </figure>
  );
}

function Manifesto() {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center">
      <div>
        <p className="font-sans text-xs tracking-widest text-muted uppercase">
          A short declaration
        </p>
        <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
          Somebody registered the domain. Somebody had to sit in the chair.
        </h2>
        <div className="mt-6 space-y-4 text-muted">
          <p>
            This office was opened for a simple reason. A name existed. It
            needed a desk, a clock, and someone willing to take the joke as far
            as letterhead.
          </p>
          <p>
            Anthropic is a real company. Claude is a real model. This is a real
            website for a domain that sounds as if it owned them. It does not.
            The stationery, however, is excellent.
          </p>
        </div>
      </div>
      <figure>
        <img
          src="/images/chair.jpg"
          alt="An empty oxblood leather armchair in a quiet office, afternoon sun on the floor."
          width={1728}
          height={1152}
          className="aspect-[3/2] w-full rounded-xl object-cover"
          decoding="async"
        />
        <figcaption className="mt-3 text-sm text-muted">
          The chair of no particular business.
        </figcaption>
      </figure>
    </section>
  );
}

function Holdings() {
  return (
    <section id="holdings" className="scroll-mt-24 border-y border-fg/10 bg-surface/60">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <p className="font-sans text-xs tracking-widest text-muted uppercase">
          Ledger
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">
          Assets under ceremonial observation
        </h2>
        <p className="mt-4 max-w-xl text-muted">
          None of these report here. We remain fond of them, and of the idea
          that fondness might count as a kind of ownership.
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {HOLDINGS.map((item) => (
            <li
              key={item.name}
              className="rounded-xl border border-fg/10 bg-bg p-5 sm:p-6"
            >
              <p className="text-xs tracking-widest text-muted uppercase">
                {item.klass}
              </p>
              <h3 className="mt-2 font-display text-2xl">{item.name}</h3>
              <p className="mt-3 flex items-center gap-2 text-sm text-fg">
                <span className="size-1.5 rounded-full bg-accent/70" aria-hidden />
                {item.status}
              </p>
              <p className="mt-3 text-sm text-muted">{item.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Desk({
  name,
  remark,
  serial,
  title,
  stamped,
  notice,
  now,
  onName,
  onRemark,
  onSubmit,
}: {
  name: string;
  remark: string;
  serial: string;
  title: string;
  stamped: boolean;
  notice: string | null;
  now: Date | null;
  onName: (value: string) => void;
  onRemark: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <section id="desk" className="scroll-mt-24 mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <p className="font-sans text-xs tracking-widest text-muted uppercase">
        The desk
      </p>
      <h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">
        Appear before the blotter
      </h2>
      <p className="mt-4 max-w-xl text-muted">
        You will be given a title you did not ask for and a serial number you
        cannot spend. Both are binding only within this page.
      </p>
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Name</span>
            <Input
              id="audience-name"
              value={name}
              onChange={(e) => onName(e.target.value)}
              placeholder="As you would like it on paper"
              maxLength={48}
              autoComplete="name"
              name="audience-name"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Remark <span className="font-normal text-muted">(optional)</span>
            </span>
            <Textarea
              id="audience-remark"
              value={remark}
              onChange={(e) => onRemark(e.target.value)}
              placeholder="A line for the registry"
              maxLength={140}
              name="audience-remark"
            />
          </label>
          <Button type="submit" id="record-audience">
            Record an audience
          </Button>
          {notice ? (
            <p className="text-sm text-muted" role="status">
              {notice}
            </p>
          ) : null}
        </form>
        <Certificate
          name={name.trim() || "Your name"}
          title={title}
          serial={serial}
          stamped={stamped}
          dateLabel={now ? format(now, "d MMMM yyyy") : "A date forthcoming"}
        />
      </div>
    </section>
  );
}

function Certificate({
  name,
  title,
  serial,
  stamped,
  dateLabel,
}: {
  name: string;
  title: string;
  serial: string;
  stamped: boolean;
  dateLabel: string;
}) {
  return (
    <article
      className="relative overflow-hidden rounded-xl border border-fg/15 bg-surface px-6 py-8 sm:px-8"
      aria-live="polite"
    >
      <p className="text-xs tracking-widest text-muted uppercase">
        Certificate of Audience
      </p>
      <p className="mt-6 font-display text-4xl leading-tight sm:text-5xl">{name}</p>
      <p className="mt-4 text-muted">{title}</p>
      <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-muted">Serial</dt>
          <dd className="mt-1 font-medium tabular-nums">{serial}</dd>
        </div>
        <div>
          <dt className="text-muted">Dated</dt>
          <dd className="mt-1 font-medium">{dateLabel}</dd>
        </div>
      </dl>
      <div className="mt-8 flex items-end justify-between gap-4">
        <p className="max-w-48 text-xs leading-relaxed text-muted">
          Vol. I · The Office of the Anthropic Owner · ceremonial use only
        </p>
        <div
          className={cn(
            "grid size-20 place-items-center rounded-full border-2 border-accent text-accent transition-[opacity,transform,filter] duration-500 ease-[var(--ease-out)]",
            stamped ? "scale-100 opacity-100" : "scale-[0.96] opacity-30",
          )}
        >
          <Crest className="size-10" />
        </div>
      </div>
    </article>
  );
}

function Registry({ visitors }: { visitors: Visitor[] }) {
  return (
    <section id="registry" className="scroll-mt-24 border-y border-fg/10 bg-surface/60">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <p className="font-sans text-xs tracking-widest text-muted uppercase">
          Visitor roll
        </p>
        <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
          Recent audiences
        </h2>
        <p className="mt-4 max-w-xl text-muted">
          Names remain on this device. The office has no memory of its own, and
          prefers it that way.
        </p>
        {visitors.length === 0 ? (
          <p className="mt-10 text-muted">No audiences recorded on this desk yet.</p>
        ) : (
          <ul className="mt-10 divide-y divide-fg/10 border-y border-fg/10">
            {visitors.map((row) => (
              <li
                key={`${row.serial}-${row.at}`}
                className="grid gap-1 py-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:items-baseline sm:gap-6"
              >
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-sm text-muted">{row.title}</p>
                </div>
                <p className="text-sm text-muted">
                  {row.remark || "No remark offered."}
                </p>
                <p className="text-xs text-muted tabular-nums sm:text-right">
                  {row.serial}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Decrees({
  value,
  onChange,
  onSubmit,
  entries,
  notice,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  entries: Decree[];
  notice: string | null;
}) {
  return (
    <section id="decrees" className="scroll-mt-24 mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <p className="font-sans text-xs tracking-widest text-muted uppercase">
            Minute-book
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
            Issue a decree
          </h2>
          <p className="mt-4 text-muted">
            Write one line. It will be filed, respected in spirit, and ignored
            in practice. That is the house style.
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Let it be known</span>
              <Input
                id="decree-line"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="that Tuesdays shall begin a little later"
                maxLength={160}
                name="decree"
              />
            </label>
            <Button type="submit" variant="outline" id="enter-decree">
              Enter in the book
            </Button>
            {notice ? (
              <p className="text-sm text-muted" role="status">
                {notice}
              </p>
            ) : null}
          </form>
          <ul className="mt-8 divide-y divide-fg/10 border-y border-fg/10">
            {entries.length === 0 ? (
              <li className="py-4 text-sm text-muted">
                The minute-book is blank. This is the preferred state.
              </li>
            ) : (
              entries.map((entry) => (
                <li key={entry.at + entry.text} className="py-4">
                  <p className="font-display text-xl leading-snug">{entry.text}</p>
                  <p className="mt-2 text-xs text-muted tabular-nums">
                    {format(new Date(entry.at), "d MMM yyyy · HH:mm")}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
        <figure className="lg:sticky lg:top-24">
          <img
            src="/images/blotter.jpg"
            alt="Overhead still life of a blotter, fountain pen, and wax seal on a walnut desk."
            width={1600}
            height={1200}
            className="aspect-4/3 w-full rounded-xl object-cover"
            decoding="async"
          />
        </figure>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-fg/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <div className="flex items-center gap-2">
            <Crest className="size-6" />
            <p className="font-display text-lg">anthropicowner.com</p>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted">
            Not affiliated with Anthropic PBC, its employees, or its models. A
            parody office for a domain, maintained with unusual dignity.
          </p>
        </div>
        <p className="text-sm text-muted">Office opened 18 January 2024</p>
      </div>
    </footer>
  );
}
