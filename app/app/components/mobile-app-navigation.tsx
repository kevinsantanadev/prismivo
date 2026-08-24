"use client";

import Link from "next/link";
import {
  Bell,
  FileCheck2,
  Files,
  FolderKanban,
  Headphones,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Newspaper,
  ReceiptText,
  Settings2,
  ShieldCheck,
  UserRoundCog,
  Users,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { signOutPath } from "@/lib/auth-paths";
import type { AppSection, MobileNavigationCopy } from "@/lib/app-shell-i18n";

const icons = {
  dashboard: LayoutDashboard,
  tasks: ListChecks,
  projects: FolderKanban,
  clients: Users,
  approvals: FileCheck2,
  files: Files,
  support: Headphones,
  content: Newspaper,
  billing: ReceiptText,
  notifications: Bell,
  team: UserRoundCog,
  admin: ShieldCheck,
  settings: Settings2,
} satisfies Record<AppSection, typeof LayoutDashboard>;

type MobileAppNavigationProps = {
  active: AppSection;
  copy: MobileNavigationCopy;
  items: Array<{ key: AppSection; href: string }>;
  primarySections: AppSection[];
};

export function MobileAppNavigation({ active, copy, items, primarySections }: MobileAppNavigationProps) {
  const dialogId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const primaryItems = primarySections
    .map((key) => items.find((item) => item.key === key))
    .filter((item): item is { key: AppSection; href: string } => Boolean(item));
  const moreIsActive = !primarySections.includes(active);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <nav className="mobile-app-navigation" aria-label={copy.mobileNavigation}>
        {primaryItems.map(({ key, href }) => {
          const Icon = icons[key];
          return (
            <Link key={key} href={href} className={active === key ? "active" : ""} aria-current={active === key ? "page" : undefined}>
              <Icon aria-hidden="true" />
              <span>{copy.nav[key]}</span>
            </Link>
          );
        })}
        <button
          ref={triggerRef}
          type="button"
          className={moreIsActive ? "active" : ""}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          onClick={() => setOpen(true)}
        >
          <Menu aria-hidden="true" />
          <span>{copy.more}</span>
        </button>
      </nav>

      {open && (
        <div className="mobile-navigation-overlay" onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section id={dialogId} className="mobile-navigation-sheet" role="dialog" aria-modal="true" aria-labelledby={`${dialogId}-title`}>
            <header>
              <div>
                <span>{copy.mobileNavigation}</span>
                <h2 id={`${dialogId}-title`}>{copy.more}</h2>
              </div>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label={copy.closeMenu} title={copy.closeMenu}>
                <X aria-hidden="true" />
              </button>
            </header>
            <nav aria-label={copy.mobileNavigation}>
              {items.map(({ key, href }) => {
                const Icon = icons[key];
                return (
                  <Link key={key} href={href} className={active === key ? "active" : ""} aria-current={active === key ? "page" : undefined} onClick={() => setOpen(false)}>
                    <Icon aria-hidden="true" />
                    <span>{copy.nav[key]}</span>
                  </Link>
                );
              })}
            </nav>
            <a className="mobile-navigation-logout" href={signOutPath("/")}>
              <LogOut aria-hidden="true" />
              {copy.logout}
            </a>
          </section>
        </div>
      )}
    </>
  );
}
