# Documento Mestre do Produto — Prismivo

## 1. Resumo executivo

**Prismivo** é uma plataforma SaaS B2B de client operations para empresas que vendem conhecimento, criatividade ou execução por projeto. Ela centraliza a jornada do cliente desde o onboarding até suporte e renovação, reduzindo retrabalho e aumentando transparência.

O produto foi escolhido porque transforma os requisitos do desafio em um sistema coerente: a área pública comercializa o SaaS; a área autenticada atende clientes e equipes; o painel administrativo opera conteúdo, contas, planos, suporte, auditoria e métricas.

## 2. Suposições registradas

1. O proprietário e autor é **Kevin Santana dos Reis**.
2. O primeiro mercado é o Brasil, com estrutura internacional em inglês e moedas localizadas.
3. O público inicial são profissionais e empresas de serviços com 1 a 30 integrantes.
4. O modelo comercial é freemium, com plano Inicial gratuito e assinaturas Studio e Escala mensais ou anuais.
5. Clientes convidados não pagam individualmente; o contratante controla seus acessos.
6. Pagamentos, e-mails e armazenamento externo possuem adaptadores e modo demonstrativo.
7. Empresas, pessoas, métricas e depoimentos usados no seed são fictícios.
8. Textos jurídicos são modelos informativos sujeitos a revisão profissional.

## 3. Público-alvo

### Primário

- Agências digitais e estúdios criativos;
- Consultorias e profissionais independentes;
- Empresas de arquitetura e projetos;
- Software houses e serviços técnicos;
- BPO financeiro, jurídico e administrativo.

### Perfis principais

- **Proprietário da operação:** quer previsibilidade, receita e visão consolidada;
- **Gerente de projeto:** precisa controlar etapas, decisões, prazos e bloqueios;
- **Especialista/editor:** produz e revisa entregáveis;
- **Suporte:** responde solicitações com contexto e SLA;
- **Cliente:** quer entender status, aprovar e encontrar documentos sem atrito.

## 4. Proposta de valor

> Transforme cada cliente em uma jornada bem conduzida.

O Prismivo substitui fragmentação por uma fonte confiável de contexto. Cada ação relevante fica ligada à organização, cliente, projeto, contrato, conteúdo ou cobrança correta.

## 5. Objetivos de negócio

- Converter visitantes em testes gratuitos;
- Aumentar ativação por onboarding guiado;
- Demonstrar valor antes da primeira semana;
- Converter testes em assinaturas;
- Reduzir cancelamentos por baixa adoção;
- Sustentar expansão de plano por volume e recursos;
- Preservar confiança por segurança, privacidade e transparência.

## 6. Módulos funcionais

1. Site público, conteúdo e SEO;
2. Autenticação, sessões e segurança da conta;
3. Organizações, membros, papéis e permissões;
4. CRM operacional de clientes;
5. Projetos, etapas, tarefas, entregáveis e aprovações;
6. Arquivos privados e versões;
7. Comentários, favoritos e notificações;
8. Central de ajuda e chamados;
9. Planos, assinaturas, cupons, pedidos e pagamentos;
10. CMS, administração, métricas e auditoria;
11. Privacidade, consentimentos, exportação e exclusão.

## 7. Mapa de páginas

### Públicas

- `/` — página inicial;
- `/produto` — visão aprofundada;
- `/solucoes` e `/solucoes/[slug]`;
- `/casos` e `/casos/[slug]`;
- `/conteudos` e `/conteudos/[slug]`;
- `/precos`;
- `/contato`;
- `/ajuda` e `/ajuda/[slug]`;
- `/seguranca`, `/acessibilidade`, `/status`;
- `/legal/privacidade`, `/legal/termos`, `/legal/cookies`, `/legal/cancelamento`, `/legal/acessibilidade` e `/legal/seguranca`;
- `/entrar`, `/cadastro`, `/verificar-email`, `/esqueci-senha`, `/redefinir-senha`;
- páginas 404, 500, manutenção e offline.

### Autenticadas

- `/app` — dashboard;
- `/app/agenda` — agenda operacional unificada;
- `/app/automacoes` — rotinas inteligentes e alertas por prazo;
- `/app/permissoes` — transparência de papéis e capacidades;
- `/app/tarefas` — quadro de execução;
- `/app/clientes`, `/app/clientes/[id]`;
- `/app/projetos`, `/app/projetos/[id]`;
- `/app/aprovacoes`, `/app/arquivos`, `/app/favoritos`;
- `/app/notificacoes`, `/app/atendimento`, `/app/atendimento/[protocolo]`;
- `/app/cobranca`, `/app/historico`;
- `/app/configuracoes/*`.

As rotas `/app`, `/app/agenda`, `/app/automacoes`, `/app/permissoes`, `/app/tarefas`, `/app/clientes`, `/app/clientes/[id]`, `/app/projetos`, `/app/projetos/[id]`, `/app/aprovacoes`, `/app/arquivos`, `/app/notificacoes`, `/app/atendimento`, `/app/atendimento/[id]` e `/app/configuracoes` já possuem telas próprias no marco atual.

### Administrativas

- `/admin` — visão geral;
- `/admin/usuarios`, `/admin/organizacoes`;
- `/admin/conteudo/*`;
- `/admin/atendimento`;
- `/admin/financeiro/*`;
- `/admin/auditoria`;
- `/admin/configuracoes`.

## 8. Fluxos prioritários

### Aquisição e ativação

1. Visitante conhece o produto;
2. Compara planos;
3. Cria conta e aceita termos;
4. Verifica e-mail;
5. Cria organização;
6. Conclui onboarding;
7. Adiciona primeiro cliente e projeto;
8. Convida o cliente para aprovar um entregável.

### Atendimento

1. Usuário pesquisa a central de ajuda;
2. Avalia artigo ou abre chamado;
3. Sistema gera protocolo;
4. Suporte assume, prioriza e responde;
5. Usuário encerra e avalia;
6. Reabertura é permitida dentro da política definida.

### Assinatura demonstrativa

1. Usuário escolhe plano e período;
2. Servidor calcula preço e benefícios;
3. Checkout em modo demo simula evento assinado;
4. Webhook interno atualiza assinatura;
5. Permissões são recalculadas;
6. Histórico registra a mudança sem armazenar cartão.

## 9. Métricas de produto

- Conversão visita → cadastro;
- Cadastro → e-mail verificado;
- Tempo até primeiro projeto;
- Tempo até primeira aprovação;
- Contas ativas em 7 e 30 dias;
- Chamados por organização e SLA;
- Conversão teste → plano;
- MRR demonstrativo, churn e expansão;
- Uso de projetos, aprovações, arquivos e portal;
- Erros e falhas de fluxo.

## 10. Critérios de sucesso

- O produto deve ser executável localmente e publicável;
- Nenhuma ação principal pode ser apenas decorativa;
- Autorização é validada no servidor;
- Dados de uma organização nunca podem vazar para outra;
- A interface funciona por teclado, toque e leitor de tela;
- O build, lint e testes principais precisam passar;
- Outra pessoa deve conseguir instalar usando apenas o README.
