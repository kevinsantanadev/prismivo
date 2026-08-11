import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_UPDATED_LABEL,
  PRIVACY_VERSION,
  TERMS_VERSION,
} from "@/lib/legal";

type LegalPage = {
  title: string;
  description: string;
  version: string;
  sections: Array<{ title: string; paragraphs: string[] }>;
};

const legalNavigation = [
  ["termos", "Termos"],
  ["privacidade", "Privacidade"],
  ["cookies", "Cookies"],
  ["cancelamento", "Cancelamento"],
  ["acessibilidade", "Acessibilidade"],
  ["seguranca", "Segurança"],
] as const;

const reviewNotice =
  "Este documento é um modelo informativo do ambiente atual e deverá ser revisado por profissional jurídico qualificado antes da operação comercial definitiva.";

const pages: Record<string, LegalPage> = {
  termos: {
    title: "Termos de Uso",
    description: "Condições aplicáveis ao acesso e ao uso do ambiente atual do Prismivo.",
    version: TERMS_VERSION,
    sections: [
      {
        title: "1. Aceitação e escopo",
        paragraphs: [
          "Ao criar um espaço ou utilizar áreas autenticadas, a pessoa usuária declara ter lido e aceitado estes Termos e a Política de Privacidade. O Prismivo está em evolução controlada; recursos comerciais, limites e integrações podem ser ajustados antes do lançamento definitivo.",
          "O plano Inicial e os valores exibidos na página pública fazem parte do produto demonstrativo. Nenhuma cobrança real é realizada nesta versão sem apresentação e confirmação explícitas de um checkout válido.",
        ],
      },
      {
        title: "2. Conta, identidade e segurança",
        paragraphs: [
          "A pessoa usuária deve fornecer informações verdadeiras, manter seu acesso protegido e comunicar suspeitas de uso indevido. A identidade é confirmada por um serviço seguro de autenticação, e senhas nunca são armazenadas em texto puro pela aplicação.",
          "Dados da empresa, clientes, projetos, tarefas, aprovações, arquivos e atendimentos são persistidos em infraestrutura de banco e armazenamento vinculada ao espaço autenticado e separados por organização no servidor.",
        ],
      },
      {
        title: "3. Uso permitido e responsabilidades",
        paragraphs: [
          "É proibido utilizar a plataforma para atividades ilícitas, invasão, fraude, assédio, envio de código malicioso, violação de propriedade intelectual, coleta indevida de dados ou automação abusiva.",
          "A pessoa usuária é responsável pela legitimidade dos dados reais inseridos e por assegurar que possui base adequada para tratar informações de clientes, colaboradores e terceiros.",
        ],
      },
      {
        title: "4. Conteúdo, arquivos e propriedade intelectual",
        paragraphs: [
          "Dados e arquivos inseridos pela pessoa usuária permanecem sob sua responsabilidade. Conteúdos identificados como demonstrativos são fictícios e podem ser removidos ou substituídos.",
          "A marca Prismivo, sua identidade visual, seus textos, sua arquitetura, sua documentação e seu código são protegidos por direitos autorais, salvo componentes de terceiros sujeitos às respectivas licenças. A disponibilização para avaliação e estudo não autoriza cópia, revenda ou apresentação como autoria própria.",
        ],
      },
      {
        title: "5. Disponibilidade, alterações e encerramento",
        paragraphs: [
          "Manutenções, incidentes, mudanças de infraestrutura ou evolução do produto podem causar indisponibilidade temporária. Medidas razoáveis de continuidade e recuperação serão adotadas conforme a maturidade operacional do serviço.",
          "Contas que violem estes Termos podem ser suspensas. Antes do lançamento comercial, os fluxos de exportação, exclusão, retenção e encerramento serão submetidos a testes completos e revisão jurídica.",
        ],
      },
      {
        title: "6. Contato e revisão profissional",
        paragraphs: [
          `Dúvidas sobre estes Termos podem ser enviadas para ${LEGAL_CONTACT_EMAIL}. Alterações materiais deverão gerar nova versão e novo registro de consentimento quando necessário.`,
          reviewNotice,
        ],
      },
    ],
  },
  privacidade: {
    title: "Política de Privacidade",
    description: "Como o Prismivo coleta, utiliza, protege e administra dados pessoais no ambiente atual.",
    version: PRIVACY_VERSION,
    sections: [
      {
        title: "1. Responsável e abrangência",
        paragraphs: [
          `O Prismivo é responsável pelo tratamento descrito nesta política e recebe solicitações pelo e-mail ${LEGAL_CONTACT_EMAIL}. Esta política se aplica ao site público, ao cadastro, ao dashboard e aos módulos autenticados da plataforma.`,
          "Empresas que inserem dados de seus próprios clientes podem atuar como controladoras desses dados, enquanto o Prismivo atua conforme a finalidade e as instruções compatíveis com o serviço.",
        ],
      },
      {
        title: "2. Dados tratados",
        paragraphs: [
          "Podem ser tratados nome, e-mail, preferências de idioma e aparência, dados da empresa, clientes, projetos, tarefas, aprovações, arquivos, atendimentos, notificações, consentimentos e registros técnicos mínimos de segurança.",
          "Credenciais de acesso são tratadas pelo serviço seguro de autenticação e senhas nunca são armazenadas em texto puro pela aplicação. Dados demonstrativos são identificados e não devem conter informações pessoais reais de terceiros.",
        ],
      },
      {
        title: "3. Finalidades e bases aplicáveis",
        paragraphs: [
          "Os dados são usados para autenticar o acesso, criar e administrar o espaço da empresa, executar funcionalidades solicitadas, proteger contas, responder atendimentos, registrar consentimentos e manter integridade operacional.",
          "As bases aplicáveis podem incluir execução de contrato ou procedimentos preliminares, cumprimento de obrigação legal, legítimo interesse com avaliação de impacto e consentimento quando ele for efetivamente necessário. Consentimentos opcionais não são marcados por padrão.",
        ],
      },
      {
        title: "4. Armazenamento, compartilhamento e transferência",
        paragraphs: [
          "Os dados estruturados são armazenados em banco gerenciado e arquivos privados em armazenamento de objetos com acesso autenticado. Prestadores essenciais de infraestrutura podem processar dados somente na medida necessária para hospedagem, segurança, entrega e suporte.",
          "Mudanças de provedor serão documentadas antes da migração. Quando houver tratamento internacional, deverão ser adotadas salvaguardas compatíveis com a legislação aplicável e com a LGPD.",
        ],
      },
      {
        title: "5. Retenção, segurança e direitos",
        paragraphs: [
          "Os dados serão mantidos pelo período necessário às finalidades informadas, à segurança, à prevenção de fraude e às obrigações legais. Exclusão ou anonimização será aplicada quando não houver fundamento legítimo para retenção.",
          "A pessoa titular poderá solicitar confirmação, acesso, correção, portabilidade quando aplicável, informação sobre compartilhamento, revisão de consentimento e exclusão. A identidade do solicitante será verificada antes de qualquer entrega ou alteração sensível.",
        ],
      },
      {
        title: "6. Atualizações e contato",
        paragraphs: [
          `Solicitações de privacidade podem ser enviadas para ${LEGAL_CONTACT_EMAIL}. Mudanças materiais nesta política serão identificadas por data e versão e poderão exigir novo aceite.`,
          reviewNotice,
        ],
      },
    ],
  },
  cookies: {
    title: "Política de Cookies e Armazenamento Local",
    description: "Tecnologias utilizadas para sessão, preferências e funcionamento seguro do Prismivo.",
    version: "cookies-1.0-2026-08-10",
    sections: [
      {
        title: "1. Tecnologias necessárias",
        paragraphs: [
          "O ambiente autenticado pode utilizar cookies estritamente necessários para manter a sessão e proteger o acesso. Eles não são empregados para publicidade e não podem ser desativados sem impedir funções essenciais.",
          "Tema, idioma e outras preferências visuais são armazenados localmente no dispositivo para que a experiência seja preservada entre visitas.",
        ],
      },
      {
        title: "2. Analytics e publicidade",
        paragraphs: [
          "Nesta versão, o Prismivo não ativa cookies de publicidade nem rastreamento comportamental. Uma futura ferramenta de analytics somente será habilitada após configuração compatível com a preferência de privacidade e a base legal aplicável.",
        ],
      },
      {
        title: "3. Controle e limpeza",
        paragraphs: [
          "A pessoa usuária pode limpar cookies e armazenamento local nas configurações do navegador. Essa ação encerra preferências locais e pode exigir novo login, mas não exclui automaticamente os dados persistentes da conta.",
          reviewNotice,
        ],
      },
    ],
  },
  cancelamento: {
    title: "Política de Cancelamento",
    description: "Regras demonstrativas para cancelamento de planos e encerramento de conta.",
    version: "cancellation-1.0-2026-08-10",
    sections: [
      {
        title: "1. Ambiente atual",
        paragraphs: [
          "O Prismivo ainda não processa pagamentos reais. Portanto, não existem cobranças, renovações ou reembolsos financeiros vinculados a esta versão demonstrativa.",
        ],
      },
      {
        title: "2. Modelo comercial planejado",
        paragraphs: [
          "Quando assinaturas forem ativadas, o cancelamento deverá impedir a renovação seguinte e manter o acesso até o fim do período já pago, salvo hipótese legal ou violação de segurança.",
          "Preço, prazo, impostos, direito de arrependimento, reembolso e eventual período de teste serão apresentados antes da contratação e validados com o provedor de pagamento.",
        ],
      },
      {
        title: "3. Dados após encerramento",
        paragraphs: [
          "Antes da exclusão definitiva, será oferecida exportação compatível com o plano e um período de segurança. Dados sujeitos a obrigação legal, prevenção de fraude ou defesa de direitos poderão ser retidos de forma limitada.",
          reviewNotice,
        ],
      },
    ],
  },
  acessibilidade: {
    title: "Declaração de Acessibilidade",
    description: "Compromisso do Prismivo com uma experiência inclusiva, previsível e utilizável.",
    version: "accessibility-1.0-2026-08-10",
    sections: [
      {
        title: "1. Compromisso",
        paragraphs: [
          "O Prismivo busca conformidade progressiva com WCAG 2.2 nível AA, usando HTML semântico, hierarquia de títulos, foco visível, textos alternativos, áreas de toque adequadas e mensagens de erro associadas aos campos.",
        ],
      },
      {
        title: "2. Preferências e movimento",
        paragraphs: [
          "O site oferece temas claro, escuro, preto e branco e automático. Animações respeitam a preferência de redução de movimento do sistema, e as funcionalidades principais permanecem disponíveis sem depender dos efeitos visuais.",
        ],
      },
      {
        title: "3. Melhoria contínua",
        paragraphs: [
          `Problemas de navegação por teclado, contraste, leitura ou compreensão podem ser relatados para ${LEGAL_CONTACT_EMAIL}, com a página, o dispositivo e a dificuldade encontrada.`,
        ],
      },
    ],
  },
  seguranca: {
    title: "Segurança",
    description: "Princípios e controles adotados para proteger contas, organizações e arquivos.",
    version: "security-1.0-2026-08-10",
    sections: [
      {
        title: "1. Controles atuais",
        paragraphs: [
          "O Prismivo valida identidade e autorização no servidor, restringe registros por organização, usa consultas parametrizadas, limita uploads, mantém arquivos privados e evita expor mensagens técnicas aos visitantes.",
          "Senhas, tokens, cookies, chaves privadas e dados financeiros completos não devem ser registrados em logs nem incluídos no repositório.",
        ],
      },
      {
        title: "2. Operação e resposta",
        paragraphs: [
          "Dependências, migrações, permissões e fluxos críticos passam por verificações antes de cada publicação. Incidentes confirmados devem ser contidos, investigados, documentados e comunicados conforme o risco e as obrigações aplicáveis.",
        ],
      },
      {
        title: "3. Relato responsável",
        paragraphs: [
          `Suspeitas de vulnerabilidade podem ser enviadas de forma responsável para ${LEGAL_CONTACT_EMAIL}. Não devem ser realizados testes destrutivos, acesso a dados de terceiros, extorsão ou divulgação antes da correção coordenada.`,
          "Esta página descreve princípios gerais e não publica detalhes que facilitem a evasão de controles.",
        ],
      },
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/legal/${slug}` },
  };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();

  return (
    <div className="legal-page">
      <a className="skip-link" href="#conteudo-legal">Pular para o documento</a>
      <header className="legal-header">
        <Link className="brand" href="/" aria-label="Prismivo — página inicial"><span className="brand-mark" aria-hidden="true"><span /></span><span>PRISMIVO</span></Link>
        <Link href="/">Voltar ao site</Link>
      </header>
      <main id="conteudo-legal">
        <span className="eyebrow">DOCUMENTO INFORMATIVO · {page.version}</span>
        <h1>{page.title}</h1>
        <p className="legal-lead">{page.description}</p>
        <div className="legal-notice">Última atualização: {LEGAL_UPDATED_LABEL}. Modelo sujeito a revisão jurídica profissional.</div>
        <nav className="legal-nav" aria-label="Documentos legais">
          {legalNavigation.map(([itemSlug, label]) => (
            <Link key={itemSlug} href={`/legal/${itemSlug}`} aria-current={itemSlug === slug ? "page" : undefined}>{label}</Link>
          ))}
        </nav>
        {page.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}
        <div className="legal-contact">
          <strong>Canal de contato</strong>
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
        </div>
      </main>
      <footer>© 2026 Prismivo. Todos os direitos reservados.</footer>
    </div>
  );
}
