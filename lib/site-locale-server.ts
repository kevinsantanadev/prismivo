import { cookies } from "next/headers";
import {
  normalizeSiteLocale,
  SITE_LOCALE_COOKIE,
  type SiteLocale,
} from "./site-locale";

export async function getRequestLocale(): Promise<SiteLocale> {
  const cookieStore = await cookies();
  return normalizeSiteLocale(cookieStore.get(SITE_LOCALE_COOKIE)?.value);
}
