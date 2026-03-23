-- PrimePass Agency travel
-- Initial seed data for a fresh Supabase project.
-- Run this after the main schema creation script.

begin;

insert into public.site_settings (
  site_name,
  support_email,
  support_phone,
  whatsapp_number,
  hero_title,
  hero_subtitle,
  about_text,
  quote_success_message
)
select
  'PrimePass Agency travel',
  'contacto@primepassagencytravel.com',
  '+351 910 000 000',
  '351910000000',
  'A viagem certa começa com um pedido simples.',
  'Escolhe o destino, envia o pedido e nós tratamos do resto.',
  'Deixa o essencial no pedido. O resto alinhamos no atendimento.',
  'Pedido enviado com sucesso. A nossa equipa entra em contacto em breve.'
where not exists (
  select 1 from public.site_settings
);

insert into public.departure_locations (
  name,
  country,
  location_type,
  airport_code,
  active,
  sort_order
)
select *
from (
  values
    ('São Paulo', 'Brasil', 'airport', 'GRU', true, 1),
    ('Lisboa', 'Portugal', 'airport', 'LIS', true, 2),
    ('Porto', 'Portugal', 'airport', 'OPO', true, 3),
    ('Luanda', 'Angola', 'airport', 'LAD', true, 4),
    ('Maputo', 'Moçambique', 'airport', 'MPM', true, 5),
    ('Rio de Janeiro', 'Brasil', 'airport', 'GIG', true, 6)
) as seed(name, country, location_type, airport_code, active, sort_order)
where not exists (
  select 1
  from public.departure_locations d
  where lower(d.name) = lower(seed.name)
    and coalesce(lower(d.country), '') = coalesce(lower(seed.country), '')
    and coalesce(lower(d.airport_code), '') = coalesce(lower(seed.airport_code), '')
);

insert into public.destinations (
  name,
  country,
  image_url,
  short_description,
  featured,
  active,
  sort_order
)
select *
from (
  values
    (
      'Dubai',
      'Emirados Árabes Unidos',
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
      'Bom para férias, compras e conforto.',
      true,
      true,
      1
    ),
    (
      'Paris',
      'França',
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
      'Clássico para viagem a dois e city break.',
      true,
      true,
      2
    ),
    (
      'Maldivas',
      'Maldivas',
      'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80',
      'Perfeito para descanso e lua de mel.',
      true,
      true,
      3
    ),
    (
      'Zanzibar',
      'Tanzânia',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
      'Praia, bom clima e ritmo leve.',
      true,
      true,
      4
    ),
    (
      'Lisboa',
      'Portugal',
      'https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1200&q=80',
      'Ótimo para escapadas urbanas e gastronomia.',
      false,
      true,
      5
    ),
    (
      'Roma',
      'Itália',
      'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1200&q=80',
      'História, comida e dias bem aproveitados.',
      false,
      true,
      6
    )
) as seed(name, country, image_url, short_description, featured, active, sort_order)
where not exists (
  select 1
  from public.destinations d
  where lower(d.name) = lower(seed.name)
    and coalesce(lower(d.country), '') = coalesce(lower(seed.country), '')
);

insert into public.testimonials (
  client_name,
  review_text,
  rating,
  source,
  active,
  sort_order
)
select *
from (
  values
    (
      'Mariana Costa',
      'Atendimento rápido, claro e muito prático. O pedido online ajudou bastante no início.',
      5,
      'Avaliação verificada',
      true,
      1
    ),
    (
      'Ricardo Almeida',
      'Gostei da forma simples como trataram tudo. A equipa percebeu logo o que queríamos.',
      5,
      'Atendimento direto',
      true,
      2
    ),
    (
      'Beatriz Santos',
      'Bom equilíbrio entre pedido online e atendimento humano. Passa confiança.',
      5,
      'Cliente PrimePass',
      true,
      3
    )
) as seed(client_name, review_text, rating, source, active, sort_order)
where not exists (
  select 1
  from public.testimonials t
  where lower(t.client_name) = lower(seed.client_name)
    and lower(t.review_text) = lower(seed.review_text)
);

commit;
