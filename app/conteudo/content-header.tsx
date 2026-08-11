import Link from "next/link";
import { PreferencesMenu } from "@/app/components/preferences-menu";

export function ContentHeader() {
  return <header className="content-site-header"><Link className="brand" href="/" aria-label="Prismivo — página inicial"><span className="brand-mark" aria-hidden="true"><span /></span><span>PRISMIVO</span></Link><nav aria-label="Central de conteúdo"><Link href="/conteudo">Conteúdo</Link><Link href="/#produto">Produto</Link><Link href="/#precos">Preços</Link></nav><div><PreferencesMenu /><Link className="sign-in" href="/entrar">Entrar</Link><Link className="button button-small" href="/cadastro">Começar grátis</Link></div></header>;
}
