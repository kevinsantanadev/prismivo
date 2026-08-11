import type { Metadata } from "next";
import { AccessPage } from "@/app/components/access-page";
import { safeReturnPath, signInPath } from "@/app/session-auth";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse com segurança seu espaço no Prismivo.",
  robots: { index: false, follow: false },
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  const destination = safeReturnPath(returnTo, "/app");
  return (
    <AccessPage
      eyebrow="BEM-VINDO DE VOLTA"
      title="Retome sua operação do ponto certo."
      description="Entre para consultar projetos, atividades, clientes e os próximos passos da sua empresa."
      primaryLabel="Entrar com segurança"
      primaryHref={signInPath(destination)}
      alternateText="Ainda não possui uma conta?"
      alternateLabel="Começar grátis"
      alternateHref="/cadastro"
      benefits={[
        "Sessão protegida e persistente",
        "Redirecionamento direto ao dashboard",
        "Dados isolados por empresa",
        "Encerramento de sessão a qualquer momento",
      ]}
      mode="login"
      returnTo={destination}
    />
  );
}
