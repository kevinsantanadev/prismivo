import type { Metadata } from "next";
import { AccessPage } from "@/app/components/access-page";
import { safeReturnPath } from "@/app/session-auth";
import { authPageCopy } from "@/lib/auth-i18n";
import { authSharedCopy } from "@/lib/auth-i18n";
import { getRequestLocale } from "@/lib/site-locale-server";

export async function generateMetadata(): Promise<Metadata> {
  const copy = authPageCopy[await getRequestLocale()].login;
  return { title: copy.metadataTitle, description: copy.metadataDescription, robots: { index: false, follow: false } };
}

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; erro?: string }>;
}) {
  const [{ returnTo, erro }, locale] = await Promise.all([searchParams, getRequestLocale()]);
  const destination = safeReturnPath(returnTo, "/app");
  return (
    <AccessPage
      locale={locale}
      mode="login"
      returnTo={destination}
      notice={erro === "confirmacao" ? authSharedCopy[locale].confirmationExpired : undefined}
    />
  );
}
