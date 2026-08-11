import type { SiteLocale } from "./site-locale";

export type AppSection =
  | "dashboard"
  | "tasks"
  | "projects"
  | "clients"
  | "approvals"
  | "files"
  | "support"
  | "content"
  | "billing"
  | "notifications"
  | "team"
  | "admin"
  | "settings";

export const appShellCopy = {
  "pt-BR": {
    skip: "Pular para o conteúdo",
    homeLabel: "Prismivo — página inicial",
    company: "Empresa",
    navigation: "Navegação do espaço",
    logout: "Sair",
    unread: (count: number) => `${count} notificações não lidas`,
    settingsFor: (name: string) => `Configurações de ${name}`,
    openProfile: "Abrir configurações do perfil",
    nav: {
      dashboard: "Visão geral", tasks: "Tarefas", projects: "Projetos", clients: "Clientes",
      approvals: "Aprovações", files: "Arquivos", support: "Atendimento", content: "Conteúdo",
      billing: "Planos", notifications: "Notificações", team: "Equipe", admin: "Administração", settings: "Configurações",
    },
  },
  en: {
    skip: "Skip to content",
    homeLabel: "Prismivo — home page",
    company: "Company",
    navigation: "Workspace navigation",
    logout: "Sign out",
    unread: (count: number) => `${count} unread notifications`,
    settingsFor: (name: string) => `Settings for ${name}`,
    openProfile: "Open profile settings",
    nav: {
      dashboard: "Overview", tasks: "Tasks", projects: "Projects", clients: "Clients",
      approvals: "Approvals", files: "Files", support: "Support", content: "Content",
      billing: "Plans", notifications: "Notifications", team: "Team", admin: "Administration", settings: "Settings",
    },
  },
  es: {
    skip: "Saltar al contenido",
    homeLabel: "Prismivo — página de inicio",
    company: "Empresa",
    navigation: "Navegación del espacio",
    logout: "Cerrar sesión",
    unread: (count: number) => `${count} notificaciones sin leer`,
    settingsFor: (name: string) => `Configuración de ${name}`,
    openProfile: "Abrir la configuración del perfil",
    nav: {
      dashboard: "Resumen", tasks: "Tareas", projects: "Proyectos", clients: "Clientes",
      approvals: "Aprobaciones", files: "Archivos", support: "Atención", content: "Contenido",
      billing: "Planes", notifications: "Notificaciones", team: "Equipo", admin: "Administración", settings: "Configuración",
    },
  },
} satisfies Record<SiteLocale, {
  skip: string;
  homeLabel: string;
  company: string;
  navigation: string;
  logout: string;
  unread: (count: number) => string;
  settingsFor: (name: string) => string;
  openProfile: string;
  nav: Record<AppSection, string>;
}>;

const translatedShellText: Record<Exclude<SiteLocale, "pt-BR">, Record<string, string>> = {
  en: {
    "Visão geral": "Overview",
    "Tarefas": "Tasks",
    "Projetos": "Projects",
    "Clientes": "Clients",
    "Aprovações": "Approvals",
    "Arquivos": "Files",
    "Atendimento": "Support",
    "Estúdio de conteúdo": "Content studio",
    "Planos e assinatura": "Plans and subscription",
    "Notificações": "Notifications",
    "Equipe": "Team",
    "Administração": "Administration",
    "Configurações": "Settings",
    "Dados protegidos da sua empresa": "Protected company data",
    "Prioridades e andamento da operação": "Operational priorities and progress",
    "Execução e prazos em um só lugar": "Delivery and timelines in one place",
    "Atualizações relevantes da sua operação": "Relevant updates from your operation",
    "Central operacional do projeto": "Project operations hub",
    "Perfil, empresa e preferências": "Profile, company, and preferences",
    "Solicitações com protocolo e histórico": "Requests with protocol and history",
    "Rascunhos, publicações e materiais": "Drafts, publications, and materials",
    "Documentos privados e vinculados": "Private, linked documents",
    "Cobrança demonstrativa e histórico": "Demonstration billing and history",
    "Cliente e projetos vinculados": "Client and linked projects",
    "Decisões registradas e vinculadas ao projeto": "Recorded decisions linked to the project",
    "Carteira protegida por empresa": "Company-protected client portfolio",
    "Indicadores, relatórios e auditoria": "Metrics, reports, and audit",
    "Histórico do atendimento": "Support history",
    "Papéis, convites e acessos": "Roles, invitations, and access",
  },
  es: {
    "Visão geral": "Resumen",
    "Tarefas": "Tareas",
    "Projetos": "Proyectos",
    "Clientes": "Clientes",
    "Aprovações": "Aprobaciones",
    "Arquivos": "Archivos",
    "Atendimento": "Atención",
    "Estúdio de conteúdo": "Estudio de contenido",
    "Planos e assinatura": "Planes y suscripción",
    "Notificações": "Notificaciones",
    "Equipe": "Equipo",
    "Administração": "Administración",
    "Configurações": "Configuración",
    "Dados protegidos da sua empresa": "Datos protegidos de tu empresa",
    "Prioridades e andamento da operação": "Prioridades y avance de la operación",
    "Execução e prazos em um só lugar": "Ejecución y plazos en un solo lugar",
    "Atualizações relevantes da sua operação": "Actualizaciones relevantes de tu operación",
    "Central operacional do projeto": "Centro operativo del proyecto",
    "Perfil, empresa e preferências": "Perfil, empresa y preferencias",
    "Solicitações com protocolo e histórico": "Solicitudes con protocolo e historial",
    "Rascunhos, publicações e materiais": "Borradores, publicaciones y materiales",
    "Documentos privados e vinculados": "Documentos privados y vinculados",
    "Cobrança demonstrativa e histórico": "Facturación demostrativa e historial",
    "Cliente e projetos vinculados": "Cliente y proyectos vinculados",
    "Decisões registradas e vinculadas ao projeto": "Decisiones registradas y vinculadas al proyecto",
    "Carteira protegida por empresa": "Cartera de clientes protegida por empresa",
    "Indicadores, relatórios e auditoria": "Indicadores, informes y auditoría",
    "Histórico do atendimento": "Historial de atención",
    "Papéis, convites e acessos": "Roles, invitaciones y accesos",
  },
};

export function translateAppShellText(value: string, locale: SiteLocale) {
  return locale === "pt-BR" ? value : translatedShellText[locale][value] ?? value;
}
