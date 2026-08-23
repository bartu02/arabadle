-- Al, Sat, Yak — v1 şeması
--
-- Tablo ve alan adlarında "car" geçmez. Kategori nesnesi "items"tır; ileride
-- araba dışında bir kategori eklenmek istenirse gereken tek şey buydu.
-- Başka soyutlama katmanı yok.

create extension if not exists pgcrypto;

-- items ----------------------------------------------------------------------
-- Oylanan tekil nesne. v1'de hepsi araba.

create table if not exists public.items (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  year_label   text,                    -- "1984-1994" — gösterim amaçlı, tarih tipi değil
  image_url    text,
  image_credit text,                    -- lisans/atıf metni, boş geçilebilir
  created_at   timestamptz not null default now()
);

-- packs ----------------------------------------------------------------------
-- Ana sayfada listelenen tema.

create table if not exists public.packs (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text,                     -- tek cümle
  sort_order  int  not null default 0
);

create index if not exists packs_sort_order_idx on public.packs (sort_order);

-- trios ----------------------------------------------------------------------
-- Bir turda yan yana gösterilen üç item.

create table if not exists public.trios (
  id         uuid primary key default gen_random_uuid(),
  pack_id    uuid not null references public.packs(id) on delete cascade,
  item_a_id  uuid not null constraint trios_item_a_id_fkey references public.items(id) on delete restrict,
  item_b_id  uuid not null constraint trios_item_b_id_fkey references public.items(id) on delete restrict,
  item_c_id  uuid not null constraint trios_item_c_id_fkey references public.items(id) on delete restrict,
  sort_order int  not null default 0,

  -- Aynı araba bir üçlüde iki kez olamaz.
  constraint trios_distinct_items check (
    item_a_id <> item_b_id
    and item_b_id <> item_c_id
    and item_a_id <> item_c_id
  ),

  -- Seed script'inin tekrar tekrar çalışabilmesi için sabit anahtar.
  constraint trios_pack_sort_unique unique (pack_id, sort_order)
);

create index if not exists trios_pack_id_sort_order_idx
  on public.trios (pack_id, sort_order);

-- votes ----------------------------------------------------------------------
-- Bir turda üç satır oluşur: her item için bir etiket.
-- session_id anonimdir, client'ta üretilir, bir kullanıcıya bağlı değildir.
-- v2'de oda modu gelirse buraya room_id eklenecek.

create table if not exists public.votes (
  id         uuid primary key default gen_random_uuid(),
  trio_id    uuid not null references public.trios(id) on delete cascade,
  item_id    uuid not null references public.items(id) on delete cascade,
  label      text not null check (label in ('buy', 'sell', 'burn')),
  session_id text not null,
  created_at timestamptz not null default now(),

  -- Aynı session, aynı üçlüde bir arabaya yalnızca bir kez oy verir...
  constraint votes_session_item_unique unique (trio_id, session_id, item_id),

  -- ...ve her etiketi yalnızca bir kez kullanır.
  -- İkisi birlikte "aynı session aynı üçlüye ikinci kez oy veremez" demek:
  -- üçlü başına en fazla 3 satır, hepsi farklı item ve farklı etiket.
  constraint votes_session_label_unique unique (trio_id, session_id, label)
);

create index if not exists votes_trio_id_idx        on public.votes (trio_id);
create index if not exists votes_item_id_label_idx  on public.votes (item_id, label);
create index if not exists votes_session_id_idx     on public.votes (session_id);

-- RLS ------------------------------------------------------------------------
-- Hesap yok, auth yok. Anon rol içeriği okur, başka hiçbir şey yapamaz.
--
-- votes tablosunda anon için ne select ne insert var. Oylar sunucu tarafında
-- secret key ile yazılır ve sayılır — yüzde hesabı client'a hiç inmez.
-- Bu yüzden SUPABASE_SECRET_KEY zorunludur.

alter table public.items enable row level security;
alter table public.packs enable row level security;
alter table public.trios enable row level security;
alter table public.votes enable row level security;

drop policy if exists items_public_read on public.items;
create policy items_public_read on public.items
  for select to anon, authenticated using (true);

drop policy if exists packs_public_read on public.packs;
create policy packs_public_read on public.packs
  for select to anon, authenticated using (true);

drop policy if exists trios_public_read on public.trios;
create policy trios_public_read on public.trios
  for select to anon, authenticated using (true);
