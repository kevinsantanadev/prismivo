"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { getMarco23Copy } from "@/lib/marco23-i18n";
import { agendaKinds, classifyAgendaDate, type AgendaEvent, type AgendaKind, type AgendaPeriod } from "@/lib/marco23";
import { toIntlLocale, type SiteLocale } from "@/lib/site-locale";

const periodOrder: AgendaPeriod[] = ["overdue", "today", "next", "later"];

export function AgendaBoard({ events, locale, today }: { events: AgendaEvent[]; locale: SiteLocale; today: string }) {
  const copy = getMarco23Copy(locale).agenda;
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<AgendaKind | "all">("all");
  const [month, setMonth] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase(toIntlLocale(locale));
    return events.filter((event) => {
      if (kind !== "all" && event.kind !== kind) return false;
      if (month && !event.date.startsWith(month)) return false;
      if (!term) return true;
      return [event.title, event.context, event.clientName]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase(toIntlLocale(locale)).includes(term));
    });
  }, [events, kind, locale, month, query]);

  const grouped = useMemo(() => periodOrder.map((period) => ({
    period,
    items: filtered.filter((event) => classifyAgendaDate(event.date, today) === period),
  })), [filtered, today]);

  return (
    <section className="agenda-board dashboard-panel" aria-labelledby="agenda-board-title">
      <div className="agenda-toolbar">
        <div><span className="panel-kicker">TIMELINE</span><h2 id="agenda-board-title">{copy.navTitle}</h2></div>
        <div className="agenda-filters">
          <label className="app-search agenda-search"><Search aria-hidden="true" /><span className="sr-only">{copy.filters.search}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.filters.placeholder} /></label>
          <label className="agenda-select"><span className="sr-only">{copy.filters.kind}</span><select value={kind} onChange={(event) => setKind(event.target.value as AgendaKind | "all")}><option value="all">{copy.filters.all}</option>{agendaKinds.map((value) => <option value={value} key={value}>{copy.kinds[value]}</option>)}</select></label>
          <label className="agenda-month"><span className="sr-only">{copy.filters.month}</span><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} aria-label={copy.filters.month} /><button type="button" onClick={() => setMonth("")} disabled={!month}>{copy.clearMonth}</button></label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state agenda-empty"><CalendarDays aria-hidden="true" /><h3>{copy.empty}</h3><p>{copy.emptyDetail}</p></div>
      ) : (
        <div className="agenda-groups">
          {grouped.filter((group) => group.items.length > 0).map(({ period, items }) => (
            <section className={`agenda-group ${period}`} key={period} aria-labelledby={`agenda-${period}`}>
              <header><span aria-hidden="true" /><h3 id={`agenda-${period}`}>{copy.groups[period]}</h3><small>{items.length}</small></header>
              <div>{items.map((event) => <AgendaRow event={event} locale={locale} key={event.id} />)}</div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

export function AgendaRow({ event, locale, compact = false }: { event: AgendaEvent; locale: SiteLocale; compact?: boolean }) {
  const copy = getMarco23Copy(locale).agenda;
  const date = new Date(`${event.date}T12:00:00`);
  return (
    <article className={`agenda-row kind-${event.kind}${compact ? " compact" : ""}`}>
      <time dateTime={event.date}><strong>{new Intl.DateTimeFormat(toIntlLocale(locale), { day: "2-digit" }).format(date)}</strong><span>{new Intl.DateTimeFormat(toIntlLocale(locale), { month: "short" }).format(date)}</span></time>
      <span className="agenda-kind">{copy.kinds[event.kind]}</span>
      <div className="agenda-row-copy"><h4>{event.title}</h4><p>{event.context}{event.clientName && event.clientName !== event.context ? ` · ${event.clientName}` : ""}</p></div>
      {!compact && event.priority && <span className={`priority-badge ${event.priority}`}>{event.priority}</span>}
      <Link href={event.href} aria-label={`${copy.open}: ${event.title}`}><span>{copy.open}</span><ChevronRight aria-hidden="true" /></Link>
    </article>
  );
}
