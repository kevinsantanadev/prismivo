# Auditoria do redesign visual premium

## Escopo preservado

O redesign é uma evolução de apresentação sobre a arquitetura existente. Rotas, autenticação, Supabase, ações de servidor, contratos de dados, regras de negócio e fluxos não fazem parte da alteração visual.

Foram inventariadas as superfícies públicas (landing page, conteúdo, status, páginas legais, estados de sistema e autenticação) e as 13 áreas do produto autenticado: visão geral, tarefas, projetos, clientes, aprovações, arquivos, atendimento, conteúdo, assinatura, notificações, equipe, administração e configurações.

Também permanecem preservadas as preferências existentes:

- idiomas português, inglês e espanhol;
- temas automático, claro, escuro e monocromático;
- seis cores de destaque;
- filtros de percepção e modos de visão de cores;
- barra lateral adaptável, clara, escura ou de marca;
- densidade, largura do conteúdo, cantos, escala tipográfica e movimento.

## Diagnóstico visual

| Área | Diagnóstico anterior | Direção adotada |
| --- | --- | --- |
| Identidade | Prisma CSS simples e secundário no hero | Prisma SVG facetado, leve, luminoso e central |
| Paleta | Verde predominante e superfícies pouco conectadas | Navy, azul elétrico, violeta e magenta pontual |
| Landing | Boa estrutura, mas aparência convencional | Composição assimétrica, profundidade e hierarquia editorial |
| Produto | Cards e valores locais com acabamentos diferentes | Tokens compartilhados e superfícies mais silenciosas |
| Autenticação | Fluxo funcional e denso visualmente | Confiança, foco, vidro controlado e formulários mais claros |
| Mobile | Regras responsivas existentes | UX específica, menos efeitos e partículas, alvos de 44 px |
| Movimento | Várias animações independentes | Curvas e durações normalizadas, transform/opacity e redução |

## Tradução das referências visuais

As referências finais enviadas para o prisma e para o vazio roxo foram usadas como direção de arte, sem incorporar ou reproduzir literalmente os arquivos no produto:

- o prisma passou a ter silhueta vertical de dupla pirâmide, faces escuras, núcleo frio e luz concentrada nas arestas, com reflexos magenta pontuais nos ombros;
- o vazio roxo foi traduzido para um campo vetorial em camadas, com partículas de escalas e profundidades diferentes e uma rotação ambiente muito lenta;
- o GIF e a imagem de referência não são entregues ao navegador: a solução permanece em SVG e CSS, sem dependência visual nova;
- no mobile, as camadas distantes e parte das partículas são removidas; com redução de movimento, todas as animações relacionadas ficam estáticas.

## Design system

A camada premium centraliza:

- fundos, superfícies, elevação, bordas e texto;
- identidade azul/violeta e cor de preferência do usuário;
- escala de espaçamento de 4 a 96 px;
- raios, sombras e estados de foco;
- durações de 140, 220 e 420 ms;
- estados hover, focus, disabled, loading, error e success;
- ajustes equivalentes para claro, escuro e monocromático.

Geist e Geist Mono continuam carregadas por `next/font`, sem novas requisições externas ou mudança de layout. O novo prisma não adiciona Three.js, WebGL ou modelos: é um SVG vetorial com animações de composição, o que reduz o custo de download e execução em smartphones.

## Critérios de QA

A validação cobre:

- build, tipos, lint e testes unitários;
- fluxos críticos e preferências existentes;
- WCAG automatizável e navegação por teclado;
- ausência de overflow e controles cortados;
- 320, 360, 375, 390, 393, 412 e 430 px;
- 768, 820 e 1024 px;
- 1280, 1366, 1440 e 1920 px;
- redução de movimento por sistema e preferência interna;
- temas claro, escuro e monocromático;
- console e falhas de rede novas.

## Limites de performance

- nenhuma dependência visual nova;
- animações apenas em `transform` e `opacity` sempre que possível;
- partículas reduzidas no mobile;
- filtros e blurs reduzidos em telas menores;
- conteúdo longo elegível para `content-visibility`;
- efeitos decorativos nunca bloqueiam interação nem leitura.
