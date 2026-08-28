"use client";

import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileCheck2,
  FolderKanban,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  PlayCircle,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AmbientPointer } from "./components/ambient-pointer";
import { KineticPrism } from "./components/kinetic-prism";
import { PreferencesMenu } from "./components/preferences-menu";
import { ScrollReveal } from "./components/scroll-reveal";
import { useSitePreferences, type SiteLocale } from "./components/site-preferences";

type Locale = SiteLocale;

const copy = {
  "pt-BR": {
    skip: "Pular para o conteúdo principal",
    nav: [
      ["Produto", "#produto"],
      ["Soluções", "#solucoes"],
      ["Casos", "#casos"],
      ["Recursos", "#recursos"],
      ["Preços", "#precos"],
    ],
    signIn: "Entrar",
    start: "Começar grátis",
    eyebrow: "CLIENT OPERATIONS, FINALMENTE CLARAS",
    title: "Transforme cada cliente em uma jornada bem conduzida.",
    subtitle:
      "Projetos, aprovações, arquivos, atendimento e cobrança em um só espaço — sem planilhas espalhadas nem conversas perdidas.",
    primary: "Criar conta gratuita",
    secondary: "Ver produto em ação",
    demoLabel: "CENÁRIO DEMONSTRATIVO",
    flow: ["Briefing recebido", "Responsável definido", "Aprovação registrada"],
    metrics: [
      ["+42%", "aprovações mais rápidas"],
      ["9,2h", "poupadas por semana"],
      ["100%", "rastreável"],
    ],
    preview: {
      project: "Projeto Aurora",
      live: "Operação sincronizada",
      liveDetail: "Atualizada agora",
      onboarding: "Onboarding",
      approvals: "3 aprovações",
      sla: "SLA",
      target: "Meta: 4h",
      activity: "Atividade",
      tasks: "Tarefas recentes",
      approved: "Aprovado",
      pending: "Pendente",
      items: ["Briefing do projeto", "Escopo e orçamento", "Contratação"],
      taskItems: [
        "Revisar identidade visual",
        "Enviar proposta comercial",
        "Coletar documentos do cliente",
      ],
      nav: [
        "Visão geral",
        "Projetos",
        "Aprovações",
        "Atendimento",
        "Cobranças",
        "Relatórios",
      ],
    },
    prism: {
      kicker: "IDENTIDADE EM MOVIMENTO",
      title: "Clareza que muda de ângulo sem perder a forma.",
      text: "O prisma representa uma operação vista por inteiro: cada face revela uma etapa, enquanto dados, decisões e responsabilidades permanecem conectados.",
      points: ["Operação visível", "Decisões rastreáveis", "Experiência consistente"],
    },
    product: {
      kicker: "UMA FONTE CONFIÁVEL PARA TODA A OPERAÇÃO",
      title: "O cliente enxerga clareza. Sua equipe ganha controle.",
      text: "O Prismivo conecta cada etapa do serviço em uma linha do tempo compartilhada, com responsabilidades, decisões e resultados visíveis para quem realmente precisa deles.",
      features: [
        {
          title: "Client Hub",
          text: "Um portal elegante para cada cliente acompanhar entregas, arquivos, mensagens e próximos passos.",
        },
        {
          title: "Projetos e aprovações",
          text: "Marcos, responsáveis, versões e aceite formal sem depender de e-mails dispersos.",
        },
        {
          title: "Atendimento com contexto",
          text: "Chamados, SLA e conversas conectados ao cliente, contrato e projeto certo.",
        },
        {
          title: "Cobrança rastreável",
          text: "Planos, faturas, cupons e status de pagamento validados pelo servidor.",
        },
      ],
    },
    solutions: {
      kicker: "SOLUÇÕES CONECTADAS",
      title: "Do primeiro contato à renovação, nada fica sem dono.",
      items: [
        ["01", "Onboarding orientado", "Briefings, documentos, termos e tarefas iniciais reunidos em um fluxo claro."],
        ["02", "Execução visível", "Cronograma, entregáveis, bloqueios e decisões acessíveis em tempo real."],
        ["03", "Aprovação segura", "Histórico de versões, comentários e aceite registrado para reduzir retrabalho."],
        ["04", "Relacionamento contínuo", "Suporte, conhecimento, cobrança e indicadores após a entrega."],
      ],
    },
    cases: {
      kicker: "CENÁRIOS DE USO",
      title: "Seis operações demonstrativas, um único sistema coerente.",
      note: "Empresas, pessoas e resultados abaixo são fictícios e foram criados exclusivamente para demonstrar o produto.",
      items: [
        ["Estúdio Norte", "Design e branding", "Aprovações visuais organizadas por versão", "−41% no ciclo de revisão", "Branding · Portal · Aprovação"],
        ["Linha Clara", "Consultoria", "Onboarding padronizado para novos clientes", "2 dias até o primeiro marco", "Consultoria · Automação · SLA"],
        ["Vereda Arquitetura", "Arquitetura", "Documentos e decisões centralizados por obra", "+36% de previsibilidade", "Projetos · Arquivos · Timeline"],
        ["Métrica Finance", "BPO financeiro", "Chamados e documentos com acesso controlado", "100% de rastreabilidade", "RBAC · Auditoria · Relatórios"],
        ["Atlas Legal", "Serviços jurídicos", "Solicitações, consentimentos e histórico seguro", "−54% em mensagens dispersas", "Privacidade · Atendimento · Logs"],
        ["Ponto Um Tech", "Software sob medida", "Entrega, suporte e cobrança conectados", "+28% em renovações", "Projetos · Billing · Suporte"],
      ],
    },
    pricing: {
      kicker: "PREÇOS TRANSPARENTES",
      title: "Comece simples. Evolua sem trocar de plataforma.",
      monthly: "Mensal",
      annual: "Anual · economize 20%",
      suffix: "/mês",
      annualNote: "valor mensal no plano anual",
      recommended: "Mais escolhido",
      plans: [
        ["Inicial", "0", "0", "Para conhecer o Prismivo com dados reais", ["3 clientes ativos", "3 projetos ativos", "Dashboard e histórico", "Sem cartão de crédito"]],
        ["Studio", "149", "119", "Para equipes de serviços em crescimento", ["20 clientes ativos", "Automações e SLAs", "Arquivos e atendimento", "Relatórios operacionais"]],
        ["Escala", "349", "279", "Para operações com processos avançados", ["Clientes ilimitados", "Papéis personalizados", "Auditoria e API", "Suporte prioritário"]],
      ],
      action: "Escolher plano",
      disclaimer: "Valores e fluxo financeiro são demonstrativos. Nenhuma cobrança real é realizada nesta versão.",
    },
    resources: {
      kicker: "CONTEÚDO QUE MELHORA A OPERAÇÃO",
      title: "Decisões melhores começam com processos compreendidos.",
      items: [
        ["Operações", "Como desenhar um onboarding que o cliente realmente conclui", "7 min"],
        ["Experiência", "Portal do cliente: o que aumenta confiança e o que cria atrito", "9 min"],
        ["Segurança", "Sete controles essenciais para proteger arquivos de clientes", "8 min"],
      ],
      action: "Explorar central de conteúdo",
    },
    faq: {
      kicker: "RESPOSTAS DIRETAS",
      title: "Perguntas frequentes",
      items: [
        ["O Prismivo substitui meu gestor de tarefas?", "Ele pode centralizar a operação com clientes e também se integrar a ferramentas internas. O foco é conectar execução, comunicação, aprovação e cobrança em uma experiência única."],
        ["Meus clientes precisam pagar para acessar?", "Não. O acesso do cliente faz parte do plano da empresa e pode ser limitado às informações autorizadas para cada conta."],
        ["Existe controle de permissões?", "Sim. A arquitetura prevê papéis granulares e toda permissão sensível é validada novamente no servidor."],
        ["Posso cancelar quando quiser?", "Sim. O modelo demonstrativo prevê cancelamento sem multa, acesso até o fim do ciclo e exportação dos dados antes da exclusão."],
        ["Como os arquivos são protegidos?", "Arquivos privados usam acesso autenticado, URLs não previsíveis, validação de tipo e tamanho e regras de propriedade por organização."],
        ["A plataforma já processa pagamentos reais?", "Nesta etapa, o checkout funciona em modo demonstrativo. A estrutura de webhooks e validação de eventos será preparada para integração segura com um provedor."],
      ],
    },
    cta: {
      eyebrow: "PRONTO PARA UMA OPERAÇÃO MAIS CLARA?",
      title: "Conduza o próximo cliente sem perder o controle do caminho.",
      primary: "Criar espaço demonstrativo",
      secondary: "Conhecer a arquitetura",
    },
    footer: {
      text: "Client operations para empresas de serviços que valorizam clareza, confiança e execução.",
      product: "Produto",
      company: "Empresa",
      legal: "Legal",
      help: "Ajuda",
      rights: "© 2026 Prismivo. Todos os direitos reservados.",
      notice: "Projeto autoral disponibilizado para avaliação profissional e estudo. Reutilização não autorizada.",
    },
    menuLabel: "Abrir menu",
    closeMenuLabel: "Fechar menu",
  },
  en: {
    skip: "Skip to main content",
    nav: [["Product", "#produto"], ["Solutions", "#solucoes"], ["Cases", "#casos"], ["Resources", "#recursos"], ["Pricing", "#precos"]],
    signIn: "Sign in",
    start: "Start free",
    eyebrow: "CLIENT OPERATIONS, FINALLY CLEAR",
    title: "Turn every client into a well-run journey.",
    subtitle: "Projects, approvals, files, support and billing in one place — without scattered spreadsheets or lost conversations.",
    primary: "Create free account",
    secondary: "See the product in action",
    demoLabel: "DEMONSTRATION SCENARIO",
    flow: ["Brief received", "Owner assigned", "Approval recorded"],
    metrics: [["+42%", "faster approvals"], ["9.2h", "saved every week"], ["100%", "traceable"]],
    preview: {
      project: "Aurora Project", live: "Operation synchronized", liveDetail: "Updated now", onboarding: "Onboarding", approvals: "3 approvals", sla: "SLA", target: "Target: 4h", activity: "Activity", tasks: "Recent tasks", approved: "Approved", pending: "Pending",
      items: ["Project brief", "Scope and budget", "Contract"], taskItems: ["Review visual identity", "Send commercial proposal", "Collect client documents"],
      nav: ["Overview", "Projects", "Approvals", "Support", "Billing", "Reports"],
    },
    prism: {
      kicker: "IDENTITY IN MOTION",
      title: "Clarity that changes angle without losing its shape.",
      text: "The prism represents a complete view of operations: every face reveals a stage while data, decisions and ownership remain connected.",
      points: ["Visible operations", "Traceable decisions", "Consistent experience"],
    },
    product: {
      kicker: "ONE TRUSTED SOURCE FOR THE WHOLE OPERATION",
      title: "Clients see clarity. Your team gains control.",
      text: "Prismivo connects every service stage in a shared timeline, with responsibilities, decisions and results visible to the people who truly need them.",
      features: [
        { title: "Client Hub", text: "An elegant portal for every client to follow deliverables, files, messages and next steps." },
        { title: "Projects and approvals", text: "Milestones, owners, versions and formal acceptance without relying on scattered email." },
        { title: "Context-aware support", text: "Tickets, SLAs and conversations connected to the right client, contract and project." },
        { title: "Traceable billing", text: "Plans, invoices, coupons and payment status validated by the server." },
      ],
    },
    solutions: {
      kicker: "CONNECTED SOLUTIONS", title: "From first contact to renewal, every step has an owner.",
      items: [["01", "Guided onboarding", "Briefs, documents, terms and initial tasks gathered into a clear flow."], ["02", "Visible delivery", "Timeline, deliverables, blockers and decisions available in real time."], ["03", "Secure approval", "Version history, comments and recorded acceptance to reduce rework."], ["04", "Ongoing relationship", "Support, knowledge, billing and indicators after delivery."]],
    },
    cases: {
      kicker: "USE SCENARIOS", title: "Six demo operations, one coherent system.", note: "Companies, people and results below are fictional and were created exclusively to demonstrate the product.",
      items: [["Estúdio Norte", "Design and branding", "Visual approvals organized by version", "−41% review cycle", "Branding · Portal · Approval"], ["Linha Clara", "Consulting", "Standardized new-client onboarding", "2 days to first milestone", "Consulting · Automation · SLA"], ["Vereda Arquitetura", "Architecture", "Documents and decisions centered by project", "+36% predictability", "Projects · Files · Timeline"], ["Métrica Finance", "Financial BPO", "Tickets and documents with controlled access", "100% traceability", "RBAC · Audit · Reports"], ["Atlas Legal", "Legal services", "Requests, consent and secure history", "−54% scattered messages", "Privacy · Support · Logs"], ["Ponto Um Tech", "Custom software", "Delivery, support and billing connected", "+28% renewals", "Projects · Billing · Support"]],
    },
    pricing: {
      kicker: "TRANSPARENT PRICING", title: "Start simple. Grow without switching platforms.", monthly: "Monthly", annual: "Annual · save 20%", suffix: "/month", annualNote: "monthly equivalent on annual billing", recommended: "Most popular",
      plans: [["Starter", "0", "0", "For exploring Prismivo with real data", ["3 active clients", "3 active projects", "Dashboard and history", "No credit card"]], ["Studio", "149", "119", "For growing service teams", ["20 active clients", "Automations and SLAs", "Files and support", "Operational reports"]], ["Scale", "349", "279", "For advanced service operations", ["Unlimited clients", "Custom roles", "Audit and API", "Priority support"]]],
      action: "Choose plan", disclaimer: "Prices and financial flow are demonstrative. No real charges are made in this version.",
    },
    resources: {
      kicker: "CONTENT THAT IMPROVES OPERATIONS", title: "Better decisions begin with understood processes.",
      items: [["Operations", "How to design onboarding clients actually complete", "7 min"], ["Experience", "Client portals: what builds trust and what creates friction", "9 min"], ["Security", "Seven essential controls for protecting client files", "8 min"]], action: "Explore content center",
    },
    faq: {
      kicker: "DIRECT ANSWERS", title: "Frequently asked questions",
      items: [["Does Prismivo replace my task manager?", "It can centralize client operations and also integrate with internal tools. Its focus is connecting delivery, communication, approval and billing in one experience."], ["Do clients pay to access it?", "No. Client access is included in the company's plan and limited to the information authorized for each account."], ["Does it support permissions?", "Yes. The architecture uses granular roles, and every sensitive permission is verified again on the server."], ["Can I cancel anytime?", "Yes. The demo model includes penalty-free cancellation, access through the billing cycle and data export before deletion."], ["How are files protected?", "Private files use authenticated access, non-predictable URLs, type and size validation and ownership rules per organization."], ["Does the platform process real payments?", "At this stage, checkout runs in demo mode. Webhooks and event-validation structure will be prepared for a secure payment provider integration."]],
    },
    cta: { eyebrow: "READY FOR A CLEARER OPERATION?", title: "Run your next client journey without losing control of the path.", primary: "Create demo workspace", secondary: "Explore the architecture" },
    footer: { text: "Client operations for service businesses that value clarity, trust and execution.", product: "Product", company: "Company", legal: "Legal", help: "Help", rights: "© 2026 Prismivo. All rights reserved.", notice: "Original project available for professional evaluation and study. Reuse is not authorized." },
    menuLabel: "Open menu",
    closeMenuLabel: "Close menu",
  },
  es: {
    skip: "Saltar al contenido principal",
    nav: [["Producto", "#produto"], ["Soluciones", "#solucoes"], ["Casos", "#casos"], ["Recursos", "#recursos"], ["Precios", "#precos"]],
    signIn: "Entrar",
    start: "Comenzar gratis",
    eyebrow: "OPERACIONES CON CLIENTES, POR FIN CLARAS",
    title: "Convierte cada cliente en una experiencia bien gestionada.",
    subtitle: "Proyectos, aprobaciones, archivos, soporte y cobros en un solo lugar, sin hojas de cálculo dispersas ni conversaciones perdidas.",
    primary: "Crear cuenta gratuita",
    secondary: "Ver el producto en acción",
    demoLabel: "ESCENARIO DEMOSTRATIVO",
    flow: ["Brief recibido", "Responsable asignado", "Aprobación registrada"],
    metrics: [["+42%", "aprobaciones más rápidas"], ["9,2 h", "ahorradas por semana"], ["100%", "rastreable"]],
    preview: {
      project: "Proyecto Aurora", live: "Operación sincronizada", liveDetail: "Actualizada ahora", onboarding: "Incorporación", approvals: "3 aprobaciones", sla: "SLA", target: "Meta: 4 h", activity: "Actividad", tasks: "Tareas recientes", approved: "Aprobado", pending: "Pendiente",
      items: ["Brief del proyecto", "Alcance y presupuesto", "Contratación"], taskItems: ["Revisar identidad visual", "Enviar propuesta comercial", "Recopilar documentos del cliente"],
      nav: ["Resumen", "Proyectos", "Aprobaciones", "Soporte", "Cobros", "Informes"],
    },
    prism: {
      kicker: "IDENTIDAD EN MOVIMIENTO",
      title: "Claridad que cambia de ángulo sin perder su forma.",
      text: "El prisma representa una visión completa de la operación: cada cara revela una etapa mientras los datos, las decisiones y las responsabilidades permanecen conectados.",
      points: ["Operación visible", "Decisiones rastreables", "Experiencia consistente"],
    },
    product: {
      kicker: "UNA FUENTE CONFIABLE PARA TODA LA OPERACIÓN",
      title: "El cliente ve claridad. Tu equipo gana control.",
      text: "Prismivo conecta cada etapa del servicio en una línea de tiempo compartida, con responsabilidades, decisiones y resultados visibles para quienes realmente los necesitan.",
      features: [
        { title: "Centro del cliente", text: "Un portal elegante para que cada cliente siga entregas, archivos, mensajes y próximos pasos." },
        { title: "Proyectos y aprobaciones", text: "Hitos, responsables, versiones y aceptación formal sin depender de correos dispersos." },
        { title: "Soporte con contexto", text: "Solicitudes, SLA y conversaciones vinculados al cliente, contrato y proyecto correctos." },
        { title: "Cobros rastreables", text: "Planes, facturas, cupones y estados de pago validados por el servidor." },
      ],
    },
    solutions: {
      kicker: "SOLUCIONES CONECTADAS", title: "Desde el primer contacto hasta la renovación, cada paso tiene un responsable.",
      items: [["01", "Incorporación guiada", "Briefs, documentos, condiciones y tareas iniciales reunidos en un flujo claro."], ["02", "Ejecución visible", "Cronograma, entregables, bloqueos y decisiones disponibles en tiempo real."], ["03", "Aprobación segura", "Historial de versiones, comentarios y aceptación registrada para reducir retrabajos."], ["04", "Relación continua", "Soporte, conocimiento, cobros e indicadores después de la entrega."]],
    },
    cases: {
      kicker: "ESCENARIOS DE USO", title: "Seis operaciones demostrativas, un único sistema coherente.", note: "Las empresas, personas y métricas siguientes son ficticias y fueron creadas exclusivamente para demostrar el producto.",
      items: [["Estúdio Norte", "Diseño y marca", "Aprobaciones visuales organizadas por versión", "−41% en el ciclo de revisión", "Marca · Portal · Aprobación"], ["Linha Clara", "Consultoría", "Incorporación estandarizada para nuevos clientes", "2 días hasta el primer hito", "Consultoría · Automatización · SLA"], ["Vereda Arquitetura", "Arquitectura", "Documentos y decisiones centralizados por obra", "+36% de previsibilidad", "Proyectos · Archivos · Cronología"], ["Métrica Finance", "BPO financiero", "Solicitudes y documentos con acceso controlado", "100% de rastreabilidad", "RBAC · Auditoría · Informes"], ["Atlas Legal", "Servicios jurídicos", "Solicitudes, consentimientos e historial seguro", "−54% de mensajes dispersos", "Privacidad · Soporte · Registros"], ["Ponto Um Tech", "Software a medida", "Entrega, soporte y cobros conectados", "+28% en renovaciones", "Proyectos · Cobros · Soporte"]],
    },
    pricing: {
      kicker: "PRECIOS TRANSPARENTES", title: "Empieza de forma simple. Crece sin cambiar de plataforma.", monthly: "Mensual", annual: "Anual · ahorra 20%", suffix: "/mes", annualNote: "equivalente mensual en el plan anual", recommended: "Más elegido",
      plans: [["Inicial", "0", "0", "Para conocer Prismivo con datos reales", ["3 clientes activos", "3 proyectos activos", "Dashboard e historial", "Sin tarjeta de crédito"]], ["Studio", "149", "119", "Para equipos de servicios en crecimiento", ["20 clientes activos", "Automatizaciones y SLA", "Archivos y soporte", "Informes operativos"]], ["Escala", "349", "279", "Para operaciones con procesos avanzados", ["Clientes ilimitados", "Roles personalizados", "Auditoría y API", "Soporte prioritario"]]],
      action: "Elegir plan", disclaimer: "Los valores y el flujo financiero son demostrativos. Esta versión no realiza cobros reales.",
    },
    resources: {
      kicker: "CONTENIDO QUE MEJORA LA OPERACIÓN", title: "Las mejores decisiones comienzan con procesos comprendidos.",
      items: [["Operaciones", "Cómo diseñar una incorporación que el cliente realmente complete", "7 min"], ["Experiencia", "Portal del cliente: qué genera confianza y qué crea fricción", "9 min"], ["Seguridad", "Siete controles esenciales para proteger archivos de clientes", "8 min"]], action: "Explorar el centro de contenidos",
    },
    faq: {
      kicker: "RESPUESTAS DIRECTAS", title: "Preguntas frecuentes",
      items: [["¿Prismivo sustituye mi gestor de tareas?", "Puede centralizar las operaciones con clientes y también integrarse con herramientas internas. Su foco es conectar ejecución, comunicación, aprobación y cobros en una sola experiencia."], ["¿Mis clientes deben pagar para acceder?", "No. El acceso del cliente forma parte del plan de la empresa y puede limitarse a la información autorizada para cada cuenta."], ["¿Existe control de permisos?", "Sí. La arquitectura prevé roles detallados y cada permiso sensible se valida nuevamente en el servidor."], ["¿Puedo cancelar cuando quiera?", "Sí. El modelo demostrativo contempla cancelación sin penalización, acceso hasta el final del ciclo y exportación de datos antes de eliminarlos."], ["¿Cómo se protegen los archivos?", "Los archivos privados usan acceso autenticado, direcciones no predecibles, validación de tipo y tamaño y reglas de propiedad por organización."], ["¿La plataforma ya procesa pagos reales?", "En esta etapa, el checkout funciona en modo demostrativo. La estructura de webhooks y validación de eventos está preparada para una integración segura con un proveedor de pagos."]],
    },
    cta: { eyebrow: "¿LISTO PARA UNA OPERACIÓN MÁS CLARA?", title: "Gestiona tu próximo cliente sin perder el control del camino.", primary: "Crear espacio demostrativo", secondary: "Conocer la arquitectura" },
    footer: { text: "Operaciones con clientes para empresas de servicios que valoran claridad, confianza y ejecución.", product: "Producto", company: "Empresa", legal: "Legal", help: "Ayuda", rights: "© 2026 Prismivo. Todos los derechos reservados.", notice: "Proyecto original disponible para evaluación profesional y estudio. La reutilización no está autorizada." },
    menuLabel: "Abrir menú",
    closeMenuLabel: "Cerrar menú",
  },
} as const;

const featureIcons = [Users, FolderKanban, MessageSquareText, CreditCard];
const sidebarIcons = [LayoutDashboard, FolderKanban, FileCheck2, MessageSquareText, CircleDollarSign, BarChart3];
const metricIcons = [Sparkles, Clock3, ShieldCheck];
const resourceSlugs = ["operacoes-conectadas", "aprovacoes-sem-atrito", "seguranca-multitenant"];

/** Public experience with device-local display preferences. */
export default function PrismivoHome() {
  const { locale } = useSitePreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  const [annual, setAnnual] = useState(true);
  const content = copy[locale];

  return (
    <div className="site-shell">
      <AmbientPointer />
      <ScrollReveal />
      <a className="skip-link" href="#conteudo">{content.skip}</a>

      <header className="site-header" aria-label="Prismivo">
        <a className="brand" href="#topo" aria-label="Prismivo — página inicial">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>PRISMIVO</span>
        </a>

        <nav className="desktop-nav" aria-label="Navegação principal">
          {content.nav.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </nav>

        <div className="header-actions">
          <PreferencesMenu />
          <a className="sign-in" href="/entrar">{content.signIn}</a>
          <a className="button button-small" href="/cadastro">{content.start}</a>
          <button className="mobile-menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={menuOpen ? content.closeMenuLabel : content.menuLabel}>
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>

        <nav id="mobile-menu" className={`mobile-nav ${menuOpen ? "is-open" : ""}`} aria-label="Navegação móvel">
          {content.nav.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <a href="/entrar" onClick={() => setMenuOpen(false)}>{content.signIn}</a>
          <a href="/cadastro" onClick={() => setMenuOpen(false)}>{content.start}</a>
        </nav>
      </header>

      <main id="conteudo">
        <section className="hero" id="topo" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow">{content.eyebrow}</span>
            <h1 id="hero-title">{content.title}</h1>
            <p>{content.subtitle}</p>
            <div className="hero-actions">
              <a className="button" href="/cadastro">{content.primary}<ArrowRight size={19} aria-hidden="true" /></a>
              <a className="button button-secondary" href="#produto"><PlayCircle size={19} aria-hidden="true" />{content.secondary}</a>
            </div>
            <span className="demo-label"><span aria-hidden="true" />{content.demoLabel}</span>
            <div className="hero-flow" role="list" aria-label={content.flow.join(", ")}>
              {content.flow.map((step, index) => (
                <span role="listitem" key={step}><i aria-hidden="true">{index + 1}</i>{step}</span>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <ProductPreview content={content.preview} />
          </div>

          <div className="metric-strip" aria-label="Métricas demonstrativas" data-reveal>
            {content.metrics.map(([value, label], index) => {
              const Icon = metricIcons[index];
              return <div className="metric" key={label}><span className="metric-icon"><Icon aria-hidden="true" /></span><strong>{value}</strong><span>{label}</span></div>;
            })}
          </div>
        </section>

        <section className="section prism-showcase" id="identidade" aria-labelledby="prism-story-title" data-reveal>
          <div className="prism-story">
            <span className="eyebrow">{content.prism.kicker}</span>
            <h2 id="prism-story-title">{content.prism.title}</h2>
            <p>{content.prism.text}</p>
            <div className="prism-points">
              {content.prism.points.map((point, index) => <span key={point}><strong>0{index + 1}</strong>{point}</span>)}
            </div>
          </div>
          <KineticPrism variant="showcase" />
        </section>

        <section className="section product-section" id="produto" aria-labelledby="product-title" data-reveal>
          <div className="section-heading">
            <span className="eyebrow">{content.product.kicker}</span>
            <h2 id="product-title">{content.product.title}</h2>
            <p>{content.product.text}</p>
          </div>
          <div className="feature-grid">
            {content.product.features.map((feature, index) => {
              const Icon = featureIcons[index];
              return <article className="feature-card" key={feature.title}><span className="feature-number">0{index + 1}</span><Icon aria-hidden="true" /><h3>{feature.title}</h3><p>{feature.text}</p></article>;
            })}
          </div>
        </section>

        <section className="section solutions-section" id="solucoes" aria-labelledby="solutions-title" data-reveal>
          <div className="section-heading compact">
            <span className="eyebrow">{content.solutions.kicker}</span>
            <h2 id="solutions-title">{content.solutions.title}</h2>
          </div>
          <div className="solutions-list">
            {content.solutions.items.map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p><ArrowRight aria-hidden="true" /></article>)}
          </div>
        </section>

        <section className="section cases-section" id="casos" aria-labelledby="cases-title" data-reveal>
          <div className="section-heading">
            <span className="eyebrow">{content.cases.kicker}</span>
            <h2 id="cases-title">{content.cases.title}</h2>
            <p>{content.cases.note}</p>
          </div>
          <div className="case-grid">
            {content.cases.items.map(([name, category, challenge, result, stack], index) => <article className="case-card" key={name}><div className={`case-visual visual-${index + 1}`} aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span></div><div className="case-content"><span>{category}</span><h3>{name}</h3><p>{challenge}</p><strong>{result}</strong><small>{stack}</small></div></article>)}
          </div>
        </section>

        <section className="section pricing-section" id="precos" aria-labelledby="pricing-title" data-reveal>
          <div className="section-heading centered">
            <span className="eyebrow">{content.pricing.kicker}</span>
            <h2 id="pricing-title">{content.pricing.title}</h2>
            <div className="billing-toggle" role="group" aria-label="Período de cobrança">
              <button type="button" className={!annual ? "active" : ""} onClick={() => setAnnual(false)} aria-pressed={!annual}>{content.pricing.monthly}</button>
              <button type="button" className={annual ? "active" : ""} onClick={() => setAnnual(true)} aria-pressed={annual}>{content.pricing.annual}</button>
            </div>
          </div>
          <div className="pricing-grid">
            {content.pricing.plans.map(([name, monthly, yearly, description, features], index) => <article className={`price-card ${index === 1 ? "featured" : ""}`} key={name}>{index === 1 && <span className="recommended">{content.pricing.recommended}</span>}<h3>{name}</h3><p>{description}</p><div className="price"><span>R$</span><strong>{annual ? yearly : monthly}</strong><small>{content.pricing.suffix}</small></div>{annual && index !== 0 && <span className="annual-note">{content.pricing.annualNote}</span>}{index === 0 && <span className="annual-note">{locale === "pt-BR" ? "gratuito, sem prazo de expiração" : locale === "es" ? "gratis, sin fecha de vencimiento" : "free with no expiration"}</span>}<ul>{features.map(feature => <li key={feature}><Check size={17} aria-hidden="true" />{feature}</li>)}</ul><a className={`button ${index === 1 ? "" : "button-secondary"}`} href={`/cadastro?plan=${["inicial", "studio", "escala"][index]}`}>{index === 0 ? content.start : content.pricing.action}<ArrowRight size={18} aria-hidden="true" /></a></article>)}
          </div>
          <p className="section-disclaimer">{content.pricing.disclaimer}</p>
        </section>

        <section className="section resources-section" id="recursos" aria-labelledby="resources-title" data-reveal>
          <div className="section-heading split-heading">
            <div><span className="eyebrow">{content.resources.kicker}</span><h2 id="resources-title">{content.resources.title}</h2></div>
            <Link className="text-link" href="/conteudo">{content.resources.action}<ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
          <div className="resource-grid">
            {content.resources.items.map(([category, title, time], index) => <article key={title}><div className={`resource-art resource-art-${index + 1}`} aria-hidden="true"><span /></div><span>{category} · {time}</span><h3>{title}</h3><Link href={`/conteudo/${resourceSlugs[index]}`} aria-label={`${title} — ${time}`}><ArrowRight aria-hidden="true" /></Link></article>)}
          </div>
        </section>

        <section className="section faq-section" id="faq" aria-labelledby="faq-title" data-reveal>
          <div className="section-heading compact"><span className="eyebrow">{content.faq.kicker}</span><h2 id="faq-title">{content.faq.title}</h2></div>
          <div className="faq-list">
            {content.faq.items.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown aria-hidden="true" /></summary><p>{answer}</p></details>)}
          </div>
        </section>

        <section className="final-cta" id="acesso" aria-labelledby="cta-title" data-reveal>
          <div className="cta-prism" aria-hidden="true"><span /></div>
          <span className="eyebrow">{content.cta.eyebrow}</span>
          <h2 id="cta-title">{content.cta.title}</h2>
          <div><a className="button" href="/cadastro">{content.cta.primary}<ArrowRight size={19} aria-hidden="true" /></a><a className="button button-secondary" href="#produto">{content.cta.secondary}</a></div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div><a className="brand" href="#topo"><span className="brand-mark" aria-hidden="true"><span /></span><span>PRISMIVO</span></a><p>{content.footer.text}</p></div>
          <div><h2>{content.footer.product}</h2><a href="#produto">Client Hub</a><a href="#solucoes">Workflows</a><a href="#precos">Pricing</a></div>
          <div><h2>{content.footer.company}</h2><a href="#casos">Cases</a><a href="#recursos">Content</a><a href="#faq">FAQ</a></div>
          <div>
            <h2>{content.footer.legal}</h2>
            <Link href="/legal/privacidade">{locale === "pt-BR" ? "Privacidade" : locale === "es" ? "Privacidad" : "Privacy"}</Link>
            <Link href="/legal/termos">{locale === "pt-BR" ? "Termos de uso" : locale === "es" ? "Condiciones de uso" : "Terms of use"}</Link>
            <Link href="/legal/cookies">Cookies</Link>
            <Link href="/legal/cancelamento">{locale === "pt-BR" ? "Cancelamento" : locale === "es" ? "Cancelación" : "Cancellation"}</Link>
            <Link href="/legal/acessibilidade">{locale === "pt-BR" ? "Acessibilidade" : locale === "es" ? "Accesibilidad" : "Accessibility"}</Link>
            <Link href="/legal/seguranca">{locale === "pt-BR" ? "Segurança" : locale === "es" ? "Seguridad" : "Security"}</Link>
            <Link href="/status">Status</Link>
          </div>
        </div>
        <div className="footer-bottom" id="legal"><span>{content.footer.rights}</span><span>{content.footer.notice}</span></div>
      </footer>
    </div>
  );
}

function ProductPreview({ content }: { content: (typeof copy)[Locale]["preview"] }) {
  return (
    <div className="product-stage" aria-label={`${content.project}: dashboard demonstrativo`}>
      <div className="dashboard-frame">
        <aside className="dashboard-sidebar" aria-label="Navegação demonstrativa do produto">
          <span className="mini-mark" aria-hidden="true" />
          {content.nav.map((label, index) => {
            const Icon = sidebarIcons[index];
            return <span key={label} className={index === 0 ? "active" : ""} title={label}><Icon aria-hidden="true" /><span className="sr-only">{label}</span></span>;
          })}
          <Settings2 aria-hidden="true" />
        </aside>
        <div className="dashboard-main">
          <div className="dashboard-top"><div><h2>{content.project}</h2><span className="dashboard-live"><i aria-hidden="true" /><strong>{content.live}</strong><small>{content.liveDetail}</small></span></div><div><Search aria-hidden="true" /><Bell aria-hidden="true" /><span>AM</span></div></div>
          <div className="dashboard-cards">
            <article><span>{content.onboarding}</span><div className="progress-ring"><strong>78%</strong></div><div className="linear-progress"><span /></div></article>
            <article className="approvals-card"><span>{content.approvals}</span>{content.items.map((item, index) => <div key={item}><small>{item}</small><em className={index === 2 ? "approved" : "pending"}>{index === 2 ? content.approved : content.pending}</em></div>)}</article>
            <article><span>{content.sla}</span><div className="gauge"><Clock3 aria-hidden="true" /></div><strong className="sla-value">2h 14min</strong><small>{content.target}</small></article>
          </div>
          <div className="dashboard-lower">
            <article><span>{content.activity}</span><div className="chart" role="img" aria-label="Gráfico demonstrativo de atividade"><i /><i /><i /><i /><i /><i /><i /></div></article>
            <article><span>{content.tasks}</span>{content.taskItems.map((item, index) => <div className="task-row" key={item}><CheckCircle2 className={index === 2 ? "done" : ""} aria-hidden="true" /><small>{item}</small><em>{index === 2 ? "✓" : ""}</em></div>)}</article>
          </div>
        </div>
      </div>
    </div>
  );
}
