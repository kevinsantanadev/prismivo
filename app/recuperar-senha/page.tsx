import type { Metadata } from "next";
import { AccessPage } from "@/app/components/access-page";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Solicite instruções seguras para recuperar o acesso ao Prismivo.",
  robots: { index: false, follow: false },
};

export default function RecuperarSenhaPage() {
  return (
    <AccessPage
      eyebrow="RECUPERAÇÃO SEGURA"
      title="Vamos ajudar você a recuperar o acesso."
      description="Informe seu e-mail. Por privacidade, a resposta será a mesma exista ou não uma conta cadastrada."
      primaryLabel="Enviar instruções"
      primaryHref="/entrar"
      alternateText="Lembrou sua senha?"
      alternateLabel="Voltar para entrar"
      alternateHref="/entrar"
      benefits={[
        "Link de uso único e validade limitada",
        "Resposta que protege a existência da conta",
        "Sessão renovada após a redefinição",
        "Nenhuma senha enviada por e-mail",
      ]}
      mode="recover"
    />
  );
}
