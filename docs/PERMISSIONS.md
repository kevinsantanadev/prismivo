# Papéis e Permissões

## Papéis operacionais implementados

| Papel | Escopo |
| --- | --- |
| Visitante | Conteúdo público autorizado, sem acesso ao espaço privado |
| Leitor (`viewer`) | Consulta dados autorizados sem alterar registros |
| Editor (`editor`) | Clientes, projetos, tarefas, aprovações, arquivos e conteúdo |
| Suporte (`support`) | Chamados, respostas e dados mínimos de atendimento |
| Administrador (`admin`) | Gestão operacional e da equipe, sem promover outro administrador |
| Proprietário (`owner`) | Controle integral da organização e transferência de propriedade |

## Matriz resumida

| Capacidade | Leitor | Editor | Suporte | Admin | Proprietário |
| --- | :---: | :---: | :---: | :---: | :---: |
| Editar perfil próprio | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ver dados da organização | ✓ | ✓ | ✓ | ✓ | ✓ |
| Criar/editar clientes e projetos | — | ✓ | — | ✓ | ✓ |
| Gerenciar tarefas, aprovações e arquivos | — | ✓ | — | ✓ | ✓ |
| Responder atendimento | — | ✓ | ✓ | ✓ | ✓ |
| Criar e publicar conteúdo da empresa | — | ✓ | — | ✓ | ✓ |
| Alterar assinatura e consultar cobrança | — | — | — | ✓ | ✓ |
| Gerenciar membros inferiores | — | — | — | ✓ | ✓ |
| Promover administrador/proprietário | — | — | — | — | ✓ |
| Ver painel administrativo | — | — | — | ✓ | ✓ |
| Alterar identidade da organização | — | — | — | ✓ | ✓ |

As rotas de escrita verificam a matriz novamente no servidor. As migrações replicam as restrições no PostgreSQL para impedir que uma chamada direta à Data API contorne a aplicação. Conteúdo público global não pode ser alterado pelas organizações, e preço ou plano nunca são aceitos como autoridade do navegador.

## Regras obrigatórias

1. O frontend apenas comunica disponibilidade; o servidor decide autorização.
2. Toda ação recebe ator, organização e recurso derivados da sessão/rota validada.
3. Superadministrador não ignora isolamento silenciosamente: acessos excepcionais são registrados.
4. Alteração de função, suspensão, reembolso e exclusão exigem confirmação e log.
5. Suporte vê somente informações necessárias para resolver o chamado.
6. Permissões financeiras são separadas das permissões operacionais.
7. Convites expiram, são de uso único e não concedem papel maior que o autorizador possui.

## Nomenclatura de permissões

```text
resource.action
projects.read
projects.create
projects.update
projects.delete
deliverables.approve
content.publish
tickets.reply
billing.read
billing.manage
members.manage
audit.read
system.manage
```
