import type { Metadata } from "next";
import { AccessPage } from "@/app/components/access-page";
import { authPageCopy } from "@/lib/auth-i18n";
import { getRequestLocale } from "@/lib/site-locale-server";

export async function generateMetadata(): Promise<Metadata> {
  const copy = authPageCopy[await getRequestLocale()].signup;
  return { title: copy.metadataTitle, description: copy.metadataDescription, robots: { index: false, follow: false } };
}

export default async function CadastroPage() {
  const locale = await getRequestLocale();
  return (
    <AccessPage
      locale={locale}
      mode="signup"
    />
  );
}
