-- Mantém os preços persistidos no servidor alinhados à apresentação pública.
-- Valores são armazenados em centavos e nunca são aceitos do navegador.

update public.plans
set
  annual_price_cents = 142800,
  updated_at = timezone('utc'::text, now())
where code = 'professional';

update public.plans
set
  monthly_price_cents = 34900,
  annual_price_cents = 334800,
  updated_at = timezone('utc'::text, now())
where code = 'scale';
