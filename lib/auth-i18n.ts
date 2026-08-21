import type { SiteLocale } from "./site-locale";

export type AuthMode = "login" | "signup" | "recover" | "resend" | "reset";

type AuthPageCopy = {
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  title: string;
  description: string;
  alternateText: string;
  alternateLabel: string;
  alternateHref: string;
  benefits: string[];
};

export const authPageCopy: Record<SiteLocale, Record<AuthMode, AuthPageCopy>> = {
  "pt-BR": {
    login: {
      metadataTitle: "Entrar",
      metadataDescription: "Acesse com segurança seu espaço no Prismivo.",
      eyebrow: "BEM-VINDO DE VOLTA",
      title: "Retome sua operação do ponto certo.",
      description: "Entre para consultar projetos, atividades, clientes e os próximos passos da sua empresa.",
      alternateText: "Ainda não possui uma conta?",
      alternateLabel: "Começar grátis",
      alternateHref: "/cadastro",
      benefits: ["Sessão protegida e persistente", "Redirecionamento direto ao dashboard", "Dados isolados por empresa", "Encerramento de sessão a qualquer momento"],
    },
    signup: {
      metadataTitle: "Criar conta gratuita",
      metadataDescription: "Crie gratuitamente o espaço operacional da sua empresa no Prismivo.",
      eyebrow: "COMECE SEM CUSTO",
      title: "Crie o espaço onde sua operação ganha clareza.",
      description: "O plano Inicial permite organizar clientes e projetos reais em um banco persistente, acompanhar atividades e experimentar o fluxo do Prismivo sem cadastrar cartão.",
      alternateText: "Já possui uma conta?",
      alternateLabel: "Entrar",
      alternateHref: "/entrar",
      benefits: ["Até 3 clientes e 3 projetos ativos", "Dashboard, histórico e notificações", "Uma empresa com acesso de proprietário", "Dados persistentes e separados por empresa"],
    },
    recover: {
      metadataTitle: "Recuperar senha",
      metadataDescription: "Solicite instruções seguras para recuperar o acesso ao Prismivo.",
      eyebrow: "RECUPERAÇÃO SEGURA",
      title: "Vamos ajudar você a recuperar o acesso.",
      description: "Informe seu e-mail. Por privacidade, a resposta será a mesma exista ou não uma conta cadastrada.",
      alternateText: "Lembrou sua senha?",
      alternateLabel: "Voltar para entrar",
      alternateHref: "/entrar",
      benefits: ["Link de uso único e validade limitada", "Resposta que protege a existência da conta", "Sessão renovada após a redefinição", "Nenhuma senha enviada por e-mail"],
    },
    resend: {
      metadataTitle: "Reenviar confirmação",
      metadataDescription: "Solicite um novo e-mail para confirmar sua conta Prismivo.",
      eyebrow: "CONFIRMAÇÃO DE CONTA",
      title: "Solicite um novo link de confirmação.",
      description: "Informe o mesmo e-mail usado no cadastro. Por privacidade, a resposta não revela se a conta existe ou já foi confirmada.",
      alternateText: "Sua conta já está confirmada?",
      alternateLabel: "Entrar",
      alternateHref: "/entrar",
      benefits: ["Link individual e de uso único", "Resposta que protege a existência da conta", "Limite contra envios abusivos", "Redirecionamento seguro após a confirmação"],
    },
    reset: {
      metadataTitle: "Definir nova senha",
      metadataDescription: "Defina uma nova senha para sua conta Prismivo.",
      eyebrow: "NOVA CREDENCIAL",
      title: "Escolha uma nova senha para sua conta.",
      description: "Use uma combinação exclusiva, longa e diferente das senhas utilizadas em outros serviços.",
      alternateText: "O link não funciona?",
      alternateLabel: "Solicitar outro",
      alternateHref: "/recuperar-senha",
      benefits: ["Mínimo de 10 caracteres", "Credencial processada pelo serviço de autenticação", "Sessões protegidas por cookies seguros", "Acesso liberado somente após validação"],
    },
  },
  en: {
    login: {
      metadataTitle: "Sign in",
      metadataDescription: "Securely access your Prismivo workspace.",
      eyebrow: "WELCOME BACK",
      title: "Resume your operation from the right point.",
      description: "Sign in to review projects, activity, clients, and your company's next steps.",
      alternateText: "Do not have an account yet?",
      alternateLabel: "Start for free",
      alternateHref: "/cadastro",
      benefits: ["Protected, persistent session", "Direct redirect to your dashboard", "Company-isolated data", "Sign out at any time"],
    },
    signup: {
      metadataTitle: "Create a free account",
      metadataDescription: "Create your company's Prismivo operations workspace for free.",
      eyebrow: "START AT NO COST",
      title: "Create the space where your operation becomes clear.",
      description: "The Starter plan lets you organize real clients and projects in a persistent database, follow activity, and experience Prismivo without adding a card.",
      alternateText: "Already have an account?",
      alternateLabel: "Sign in",
      alternateHref: "/entrar",
      benefits: ["Up to 3 active clients and 3 projects", "Dashboard, activity, and notifications", "One company with owner access", "Persistent, company-isolated data"],
    },
    recover: {
      metadataTitle: "Recover password",
      metadataDescription: "Request secure instructions to recover access to Prismivo.",
      eyebrow: "SECURE RECOVERY",
      title: "Let us help you recover access.",
      description: "Enter your email. For privacy, the response is identical whether or not an account exists.",
      alternateText: "Remembered your password?",
      alternateLabel: "Return to sign in",
      alternateHref: "/entrar",
      benefits: ["Single-use, time-limited link", "Response that protects account existence", "Session renewed after reset", "Passwords are never sent by email"],
    },
    resend: {
      metadataTitle: "Resend confirmation",
      metadataDescription: "Request a new email to confirm your Prismivo account.",
      eyebrow: "ACCOUNT CONFIRMATION",
      title: "Request a new confirmation link.",
      description: "Enter the same email used during registration. For privacy, the response does not reveal whether the account exists or is already confirmed.",
      alternateText: "Is your account already confirmed?",
      alternateLabel: "Sign in",
      alternateHref: "/entrar",
      benefits: ["Individual, single-use link", "Response that protects account existence", "Protection against abusive sends", "Safe redirect after confirmation"],
    },
    reset: {
      metadataTitle: "Set a new password",
      metadataDescription: "Set a new password for your Prismivo account.",
      eyebrow: "NEW CREDENTIAL",
      title: "Choose a new password for your account.",
      description: "Use a unique, long combination that differs from passwords used on other services.",
      alternateText: "Is the link not working?",
      alternateLabel: "Request another",
      alternateHref: "/recuperar-senha",
      benefits: ["At least 10 characters", "Credential processed by the authentication service", "Sessions protected by secure cookies", "Access granted only after validation"],
    },
  },
  es: {
    login: {
      metadataTitle: "Iniciar sesión",
      metadataDescription: "Accede de forma segura a tu espacio en Prismivo.",
      eyebrow: "TE DAMOS LA BIENVENIDA",
      title: "Retoma tu operación desde el punto correcto.",
      description: "Inicia sesión para consultar proyectos, actividad, clientes y los próximos pasos de tu empresa.",
      alternateText: "¿Todavía no tienes una cuenta?",
      alternateLabel: "Comenzar gratis",
      alternateHref: "/cadastro",
      benefits: ["Sesión protegida y persistente", "Acceso directo al panel", "Datos aislados por empresa", "Cierre de sesión en cualquier momento"],
    },
    signup: {
      metadataTitle: "Crear una cuenta gratuita",
      metadataDescription: "Crea gratis el espacio operativo de tu empresa en Prismivo.",
      eyebrow: "COMIENZA SIN COSTO",
      title: "Crea el espacio donde tu operación gana claridad.",
      description: "El plan Inicial permite organizar clientes y proyectos reales en una base persistente, seguir la actividad y probar Prismivo sin registrar una tarjeta.",
      alternateText: "¿Ya tienes una cuenta?",
      alternateLabel: "Iniciar sesión",
      alternateHref: "/entrar",
      benefits: ["Hasta 3 clientes y 3 proyectos activos", "Panel, historial y notificaciones", "Una empresa con acceso de propietario", "Datos persistentes y aislados por empresa"],
    },
    recover: {
      metadataTitle: "Recuperar contraseña",
      metadataDescription: "Solicita instrucciones seguras para recuperar el acceso a Prismivo.",
      eyebrow: "RECUPERACIÓN SEGURA",
      title: "Te ayudaremos a recuperar el acceso.",
      description: "Introduce tu correo. Por privacidad, la respuesta será la misma exista o no una cuenta registrada.",
      alternateText: "¿Recordaste tu contraseña?",
      alternateLabel: "Volver a iniciar sesión",
      alternateHref: "/entrar",
      benefits: ["Enlace de un solo uso y validez limitada", "Respuesta que protege la existencia de la cuenta", "Sesión renovada después del cambio", "Ninguna contraseña enviada por correo"],
    },
    resend: {
      metadataTitle: "Reenviar confirmación",
      metadataDescription: "Solicita un nuevo correo para confirmar tu cuenta de Prismivo.",
      eyebrow: "CONFIRMACIÓN DE CUENTA",
      title: "Solicita un nuevo enlace de confirmación.",
      description: "Introduce el mismo correo utilizado en el registro. Por privacidad, la respuesta no revela si la cuenta existe o ya fue confirmada.",
      alternateText: "¿Tu cuenta ya está confirmada?",
      alternateLabel: "Iniciar sesión",
      alternateHref: "/entrar",
      benefits: ["Enlace individual y de un solo uso", "Respuesta que protege la existencia de la cuenta", "Límite contra envíos abusivos", "Redirección segura después de confirmar"],
    },
    reset: {
      metadataTitle: "Definir una nueva contraseña",
      metadataDescription: "Define una nueva contraseña para tu cuenta de Prismivo.",
      eyebrow: "NUEVA CREDENCIAL",
      title: "Elige una nueva contraseña para tu cuenta.",
      description: "Usa una combinación exclusiva, larga y diferente de las contraseñas utilizadas en otros servicios.",
      alternateText: "¿El enlace no funciona?",
      alternateLabel: "Solicitar otro",
      alternateHref: "/recuperar-senha",
      benefits: ["Mínimo de 10 caracteres", "Credencial procesada por el servicio de autenticación", "Sesiones protegidas por cookies seguras", "Acceso habilitado solo después de la validación"],
    },
  },
};

export const authSharedCopy = {
  "pt-BR": {
    skip: "Pular para o conteúdo", homeLabel: "Prismivo — página inicial", back: "Voltar ao site",
    protectedTitle: "Conta protegida", protectedDescription: "Identidade confirmada sem expor sua senha ao Prismivo.",
    cardLabel: "Acesso seguro", cardTitle: "Acesso seguro",
    cardDescription: "Sua identidade é confirmada por um fluxo de acesso seguro. Depois, você cria o espaço da empresa e já pode usar o plano gratuito.",
    noCard: "sem cartão de crédito", legalPrefix: "Ao continuar, você poderá revisar e aceitar os", terms: "Termos de Uso",
    privacyJoin: "e a", privacy: "Política de Privacidade", setupSuffix: "durante a configuração. Conheça também nossos",
    security: "controles de segurança", footer: "Todos os direitos reservados.",
  },
  en: {
    skip: "Skip to content", homeLabel: "Prismivo — home page", back: "Back to website",
    protectedTitle: "Protected account", protectedDescription: "Your identity is confirmed without exposing your password to Prismivo.",
    cardLabel: "Secure access", cardTitle: "Secure access",
    cardDescription: "Your identity is confirmed through a secure access flow. Then you create the company workspace and can start using the free plan.",
    noCard: "no credit card required", legalPrefix: "By continuing, you can review and accept the", terms: "Terms of Use",
    privacyJoin: "and the", privacy: "Privacy Policy", setupSuffix: "during setup. You can also review our",
    security: "security controls", footer: "All rights reserved.",
  },
  es: {
    skip: "Saltar al contenido", homeLabel: "Prismivo — página de inicio", back: "Volver al sitio",
    protectedTitle: "Cuenta protegida", protectedDescription: "Tu identidad se confirma sin exponer tu contraseña a Prismivo.",
    cardLabel: "Acceso seguro", cardTitle: "Acceso seguro",
    cardDescription: "Tu identidad se confirma mediante un flujo de acceso seguro. Después creas el espacio de la empresa y ya puedes usar el plan gratuito.",
    noCard: "sin tarjeta de crédito", legalPrefix: "Al continuar, podrás revisar y aceptar los", terms: "Términos de Uso",
    privacyJoin: "y la", privacy: "Política de Privacidad", setupSuffix: "durante la configuración. Consulta también nuestros",
    security: "controles de seguridad", footer: "Todos los derechos reservados.",
  },
} satisfies Record<SiteLocale, Record<string, string>>;

export const authFormCopy = {
  "pt-BR": {
    fullName: "Nome completo", email: "E-mail", password: "Senha", newPassword: "Nova senha",
    passwordHint: "Use pelo menos 10 caracteres.", forgotPassword: "Esqueci minha senha", confirmPassword: "Confirmar senha",
    pending: "Aguarde…", login: "Entrar", signup: "Criar conta gratuita", recover: "Enviar instruções", resend: "Reenviar confirmação", reset: "Salvar nova senha",
    resendConfirmation: "Não recebeu? Solicite outro e-mail de confirmação",
  },
  en: {
    fullName: "Full name", email: "Email", password: "Password", newPassword: "New password",
    passwordHint: "Use at least 10 characters.", forgotPassword: "I forgot my password", confirmPassword: "Confirm password",
    pending: "Please wait…", login: "Sign in", signup: "Create free account", recover: "Send instructions", resend: "Resend confirmation", reset: "Save new password",
    resendConfirmation: "Did not receive it? Request another confirmation email",
  },
  es: {
    fullName: "Nombre completo", email: "Correo electrónico", password: "Contraseña", newPassword: "Nueva contraseña",
    passwordHint: "Usa al menos 10 caracteres.", forgotPassword: "Olvidé mi contraseña", confirmPassword: "Confirmar contraseña",
    pending: "Espera…", login: "Iniciar sesión", signup: "Crear cuenta gratuita", recover: "Enviar instrucciones", resend: "Reenviar confirmación", reset: "Guardar nueva contraseña",
    resendConfirmation: "¿No lo recibiste? Solicita otro correo de confirmación",
  },
} satisfies Record<SiteLocale, Record<string, string>>;

export const authActionCopy = {
  "pt-BR": {
    invalidLogin: "Revise o e-mail e a senha informados.", rateLimit: "Muitas tentativas em sequência. Aguarde alguns minutos e tente novamente.",
    rateLimitUnavailable: "Não foi possível validar a tentativa agora. Aguarde um instante e tente novamente.",
    invalidCredentials: "Não foi possível entrar com essas credenciais.", passwordsMismatch: "As senhas devem ser iguais.", invalidData: "Revise os dados informados.",
    signupFailed: "Não foi possível concluir o cadastro. Revise os dados e tente novamente.", signupEmailUnavailable: "O serviço de confirmação por e-mail está temporariamente indisponível. Seus dados não foram expostos; tente novamente mais tarde.", signupSuccess: "Cadastro processado. Se este for um e-mail novo, enviaremos o link de confirmação. Se você já criou a conta antes, entre com sua senha ou use a recuperação de acesso.",
    invalidEmail: "Informe um e-mail válido.", recoverySuccess: "Se existir uma conta válida para esse e-mail, enviaremos as instruções de recuperação.", resendSuccess: "Se houver uma conta aguardando confirmação, um novo link será enviado para esse e-mail.",
    invalidPassword: "Revise a nova senha.", resetExpired: "O link expirou ou a sessão não pôde ser validada. Solicite uma nova recuperação.", resetSuccess: "Senha alterada com segurança. Você já pode entrar.",
  },
  en: {
    invalidLogin: "Review the email and password provided.", rateLimit: "Too many attempts in a short period. Wait a few minutes and try again.",
    rateLimitUnavailable: "We could not validate this attempt right now. Wait a moment and try again.",
    invalidCredentials: "We could not sign you in with those credentials.", passwordsMismatch: "The passwords must match.", invalidData: "Review the information provided.",
    signupFailed: "We could not complete the registration. Review the information and try again.", signupEmailUnavailable: "The email confirmation service is temporarily unavailable. Your data was not exposed; please try again later.", signupSuccess: "Registration processed. If this is a new email address, we will send a confirmation link. If you created the account before, sign in with your password or recover access.",
    invalidEmail: "Enter a valid email address.", recoverySuccess: "If a valid account exists for this email, we will send recovery instructions.", resendSuccess: "If an account is awaiting confirmation, a new link will be sent to this email.",
    invalidPassword: "Review the new password.", resetExpired: "The link expired or the session could not be validated. Request a new recovery email.", resetSuccess: "Password changed securely. You can now sign in.",
  },
  es: {
    invalidLogin: "Revisa el correo y la contraseña indicados.", rateLimit: "Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.",
    rateLimitUnavailable: "No pudimos validar este intento ahora. Espera un momento e inténtalo de nuevo.",
    invalidCredentials: "No pudimos iniciar sesión con esas credenciales.", passwordsMismatch: "Las contraseñas deben coincidir.", invalidData: "Revisa la información indicada.",
    signupFailed: "No pudimos completar el registro. Revisa los datos e inténtalo de nuevo.", signupEmailUnavailable: "El servicio de confirmación por correo no está disponible temporalmente. Tus datos no fueron expuestos; inténtalo más tarde.", signupSuccess: "Registro procesado. Si este correo es nuevo, enviaremos un enlace de confirmación. Si ya creaste la cuenta, inicia sesión con tu contraseña o recupera el acceso.",
    invalidEmail: "Introduce un correo electrónico válido.", recoverySuccess: "Si existe una cuenta válida para este correo, enviaremos las instrucciones de recuperación.", resendSuccess: "Si existe una cuenta pendiente de confirmación, enviaremos un nuevo enlace a este correo.",
    invalidPassword: "Revisa la nueva contraseña.", resetExpired: "El enlace venció o no se pudo validar la sesión. Solicita una nueva recuperación.", resetSuccess: "Contraseña actualizada de forma segura. Ya puedes iniciar sesión.",
  },
} satisfies Record<SiteLocale, Record<string, string>>;
