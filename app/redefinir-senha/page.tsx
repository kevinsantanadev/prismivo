import type { Metadata } from "next";
import { AccessPage } from "@/app/components/access-page";

export const metadata: Metadata = {
  title: "Definir nova senha",
  description: "Defina uma nova senha para sua conta Prismivo.",
  robots: { index: false, follow: false },
};

export default function RedefinirSenhaPage() {
  return (
    <AccessPage
      eyebrow="NOVA CREDENCIAL"
      title="Escolha uma nova senha para sua conta."
      description="Use uma combinação exclusiva, longa e diferente das senhas utilizadas em outros serviços."
      primaryLabel="Salvar nova senha"
      primaryHref="/recuperar-senha"
      alternateText="O link não funciona?"
      alternateLabel="Solicitar outro"
      alternateHref="/recuperar-senha"
      benefits={[
        "Mínimo de 10 caracteres",
        "Credencial processada pelo serviço de autenticação",
        "Sessões protegidas por cookies seguros",
        "Acesso liberado somente após validação",
      ]}
      mode="reset"
    />
  );
}
