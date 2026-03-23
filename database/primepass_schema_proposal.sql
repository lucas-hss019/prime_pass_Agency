-- PrimePass Agency travel
-- Clean database creation script for a fresh Supabase project.

begin;

create or replace function public.normalize_email(value text)
returns text
language sql
immutable
as $$
  select nullif(lower(btrim(value)), '');
$$;

create or replace function public.normalize_phone(value text)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(coalesce(value, ''), '\D', '', 'g'), '');
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.departure_locations (
  id bigint generated always as identity primary key,
  name text not null,
  country text not null,
  location_type text not null default 'airport',
  airport_code text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departure_locations_airport_code_chk
    check (airport_code is null or char_length(airport_code) between 3 and 8)
);

create index if not exists departure_locations_active_idx
  on public.departure_locations (active, sort_order, name);

create table if not exists public.destinations (
  id bigint generated always as identity primary key,
  name text not null,
  country text not null,
  image_url text,
  short_description text,
  featured boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists destinations_active_idx
  on public.destinations (active, featured, sort_order, name);

create table if not exists public.customers (
  id bigint generated always as identity primary key,
  full_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_contact_chk
    check (
      public.normalize_email(email) is not null
      or
      public.normalize_phone(phone) is not null
    )
);

create unique index if not exists customers_email_unique_idx
  on public.customers (public.normalize_email(email))
  where public.normalize_email(email) is not null;

create unique index if not exists customers_phone_unique_idx
  on public.customers (public.normalize_phone(phone))
  where public.normalize_phone(phone) is not null;

create table if not exists public.quotes (
  id bigint generated always as identity primary key,
  customer_id bigint references public.customers(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  trip_type text not null default 'round_trip',
  people_count smallint not null default 1,
  departure_location_id bigint references public.departure_locations(id) on delete set null,
  departure_text text not null,
  destination_id bigint references public.destinations(id) on delete set null,
  destination_text text not null,
  departure_date date,
  return_date date,
  departure_date_flexible boolean not null default false,
  return_date_flexible boolean not null default false,
  accepts_connections boolean not null default false,
  max_connections smallint,
  notes text,
  source_channel text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotes_trip_type_chk
    check (trip_type in ('one_way', 'round_trip')),
  constraint quotes_people_count_chk
    check (people_count >= 1),
  constraint quotes_return_date_chk
    check (trip_type = 'round_trip' or return_date is null),
  constraint quotes_connections_chk
    check (
      (accepts_connections = false and max_connections is null)
      or
      (accepts_connections = true and max_connections between 1 and 3)
    )
);

create index if not exists quotes_created_at_idx
  on public.quotes (created_at desc);

create index if not exists quotes_customer_idx
  on public.quotes (customer_id);

create index if not exists quotes_departure_destination_idx
  on public.quotes (departure_location_id, destination_id);

create index if not exists quotes_email_idx
  on public.quotes (lower(email));

create table if not exists public.testimonials (
  id bigint generated always as identity primary key,
  client_name text not null,
  review_text text not null,
  rating integer not null check (rating between 1 and 5),
  source text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id bigint generated always as identity primary key,
  site_name text not null default 'PrimePass Agency travel',
  support_email text,
  support_phone text,
  whatsapp_number text,
  hero_title text,
  hero_subtitle text,
  about_text text,
  quote_success_message text,
  updated_at timestamptz not null default now()
);

create or replace function public.sync_customer_from_quote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_customer_id bigint;
  normalized_email text;
  normalized_phone text;
begin
  normalized_email := public.normalize_email(new.email);
  normalized_phone := public.normalize_phone(new.phone);

  if normalized_email is null and normalized_phone is null then
    new.customer_id := null;
    return new;
  end if;

  select c.id
  into matched_customer_id
  from public.customers c
  where (normalized_email is not null and public.normalize_email(c.email) = normalized_email)
     or (normalized_phone is not null and public.normalize_phone(c.phone) = normalized_phone)
  order by
    case
      when normalized_email is not null and public.normalize_email(c.email) = normalized_email then 0
      else 1
    end,
    c.id
  limit 1;

  if matched_customer_id is null then
    insert into public.customers (
      full_name,
      email,
      phone
    )
    values (
      btrim(new.full_name),
      case when normalized_email is not null then btrim(new.email) else null end,
      case when normalized_phone is not null then btrim(new.phone) else null end
    )
    returning id into matched_customer_id;
  else
    update public.customers
    set full_name = coalesce(nullif(btrim(new.full_name), ''), full_name),
        email = case
          when normalized_email is not null
            and not exists (
              select 1
              from public.customers other
              where other.id <> matched_customer_id
                and public.normalize_email(other.email) = normalized_email
            )
            then btrim(new.email)
          else email
        end,
        phone = case
          when normalized_phone is not null
            and not exists (
              select 1
              from public.customers other
              where other.id <> matched_customer_id
                and public.normalize_phone(other.phone) = normalized_phone
            )
            then btrim(new.phone)
          else phone
        end,
        updated_at = now()
    where id = matched_customer_id;
  end if;

  new.customer_id := matched_customer_id;
  return new;
end;
$$;

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

drop trigger if exists departure_locations_set_updated_at on public.departure_locations;
create trigger departure_locations_set_updated_at
before update on public.departure_locations
for each row
execute function public.set_updated_at();

drop trigger if exists destinations_set_updated_at on public.destinations;
create trigger destinations_set_updated_at
before update on public.destinations
for each row
execute function public.set_updated_at();

drop trigger if exists quotes_sync_customer on public.quotes;
create trigger quotes_sync_customer
before insert or update on public.quotes
for each row
execute function public.sync_customer_from_quote();

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at
before update on public.quotes
for each row
execute function public.set_updated_at();

drop trigger if exists testimonials_set_updated_at on public.testimonials;
create trigger testimonials_set_updated_at
before update on public.testimonials
for each row
execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row
execute function public.set_updated_at();

create or replace view public.destinations_dropdown as
select
  id,
  name,
  country
from public.destinations
where active = true
order by featured desc, sort_order asc, name asc;

create or replace view public.departure_locations_dropdown as
select
  id,
  name,
  country,
  location_type,
  airport_code
from public.departure_locations
where active = true
order by sort_order asc, name asc;

comment on table public.quotes is
  'Website quote requests with only the essential information needed before human follow-up.';

comment on table public.customers is
  'Clients captured from quote requests, stored separately for easier follow-up.';

comment on column public.quotes.customer_id is
  'Customer linked automatically from the quote contact details.';

comment on column public.quotes.departure_text is
  'Free-text departure entered by the client.';

comment on column public.quotes.destination_text is
  'Free-text destination entered by the client.';

comment on column public.quotes.departure_date_flexible is
  'True when the client accepts flexibility in the departure date.';

comment on column public.quotes.return_date_flexible is
  'True when the client accepts flexibility in the return date.';

comment on column public.quotes.accepts_connections is
  'True when the client accepts flight connections or stopovers.';

comment on column public.quotes.max_connections is
  'Maximum number of accepted connections when accepts_connections is true.';

commit;
