import type { Metadata } from "next";
import { AccessPage } from "@/app/components/access-page";
import { signInPath } from "@/app/session-auth";

export const metadata: Metadata = {
  title: "Criar conta gratuita",
  description: "Crie gratuitamente o espaço operacional da sua empresa no Prismivo.",
  robots: { index: false, follow: false },
};

export default function CadastroPage() {
  return (
    <AccessPage
      eyebrow="COMECE SEM CUSTO"
      title="Crie o espaço onde sua operação ganha clareza."
      description="O plano Inicial permite organizar clientes e projetos reais em um banco persistente, acompanhar atividades e experimentar o fluxo do Prismivo sem cadastrar cartão."
      primaryLabel="Criar minha conta"
      primaryHref={signInPath("/app/onboarding")}
      alternateText="Já possui uma conta?"
      alternateLabel="Entrar"
      alternateHref="/entrar"
      benefits={[
        "Até 3 clientes e 3 projetos ativos",
        "Dashboard, histórico e notificações",
        "Uma empresa com acesso de proprietário",
        "Dados persistentes e separados por empresa",
      ]}
      mode="signup"
    />
  );
}
