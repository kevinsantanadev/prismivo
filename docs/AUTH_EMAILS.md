# E-mails transacionais de autenticação

O Prismivo usa o Supabase Auth para cadastro, confirmação de e-mail e recuperação de senha. O código nunca envia senhas e não armazena credenciais de SMTP no repositório.

## Por que um SMTP próprio é obrigatório

O provedor de e-mail padrão do Supabase existe apenas para demonstrações. Ele possui limite muito baixo e pode enviar somente para endereços autorizados da equipe. Antes de liberar cadastros públicos, conecte um provedor SMTP transacional próprio.

## Configuração de produção

1. O domínio `kevinsantanadev.com.br` deve estar verificado no Resend; o remetente transacional recomendado é `no-reply@kevinsantanadev.com.br`.
2. Mantenha os registros DNS SPF e DKIM fornecidos pelo Resend. DMARC é recomendado.
3. No projeto Supabase exclusivo do Prismivo, abra **Authentication > Emails > SMTP Settings**.
4. Ative o SMTP personalizado e informe host, porta, usuário, senha, remetente e nome do remetente.
5. Em **Authentication > URL Configuration**, use:
   - Site URL: `https://prismivo.kevinsantanadev.com.br`
   - Redirect URL: `https://prismivo.kevinsantanadev.com.br/auth/callback`
6. Em **Authentication > Providers > Email**, mantenha a confirmação de e-mail habilitada.
7. Ajuste os limites em **Authentication > Rate Limits** somente depois de validar a capacidade do provedor.

Configuração SMTP do Resend:

- host: `smtp.resend.com`;
- porta: `587` com STARTTLS;
- usuário: `resend`;
- senha: uma chave exclusiva, com permissão somente de envio e limitada ao domínio;
- nome do remetente: `Prismivo`.

Nunca salve a senha SMTP ou uma API key em `.env.example`, no README, em issues ou em commits.

## Template recomendado para cadastro com SSR/PKCE

O endpoint `app/auth/confirm/route.ts` aceita o hash de uso único recomendado pelo Supabase. No template **Confirm signup**, use um link equivalente a:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/app/onboarding">
  Confirmar minha conta
</a>
```

O destino é validado no servidor para impedir redirecionamentos externos.

Os arquivos versionados em `supabase/templates/confirmation.html` e `supabase/templates/recovery.html` contêm os modelos acessíveis e responsivos que devem ser copiados para os respectivos templates do Supabase. Eles não possuem chaves, tokens ou dados de usuários.

## Validação antes do lançamento

- criar uma conta com um endereço que não pertença à equipe do Supabase;
- confirmar recebimento, remetente, SPF, DKIM e ausência de alertas de phishing;
- clicar no link uma vez e validar o redirecionamento para o onboarding;
- confirmar que reutilizar o mesmo link falha com segurança;
- testar **Reenviar confirmação** após o intervalo mínimo;
- testar recuperação de senha;
- conferir os logs do Supabase Auth e do provedor SMTP sem registrar tokens completos.

Referências oficiais:

- [SMTP personalizado](https://supabase.com/docs/guides/auth/auth-smtp)
- [Autenticação por senha e fluxo PKCE](https://supabase.com/docs/guides/auth/passwords)
- [URLs de redirecionamento](https://supabase.com/docs/guides/auth/redirect-urls)
- [Limites do Auth](https://supabase.com/docs/guides/auth/rate-limits)
