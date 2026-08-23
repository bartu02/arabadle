-- Al, Sat, Yak — hız sınırı sayacı
--
-- Neden veritabanında: uygulama Vercel'de serverless çalışıyor, her örneğin
-- kendi hafızası var. Süreç içi bir Map aynı IP'yi farklı örneklerde
-- göremediği için tek başına sayamaz. Sayaç ortak olmak zorunda.
--
-- Tabloda IP yok: uygulama IP'nin tuzlu SHA-256 özetini gönderiyor
-- (lib/security.js -> ipKey). Sayaç tutmaya yetiyor, kimse tanımlanamıyor.

create table if not exists public.rate_limits (
  bucket       text primary key,
  window_start timestamptz not null default now(),
  hits         int not null default 1
);

create index if not exists rate_limits_window_start_idx
  on public.rate_limits (window_start);

-- Birden çok kovayı tek gidiş-dönüşte sayar ve hepsinin sınır içinde olup
-- olmadığını döndürür. Kova dolduysa bile sayaç artar — ısrar eden bekler.
--
-- Pencere kayan değil, sabit: pencere dolduğunda sayaç sıfırlanır. Basit
-- ve bu iş için yeterli; kesin kayan pencere ayrı bir satır geçmişi ister.
create or replace function public.rate_hit(
  p_buckets text[],
  p_limits  int[],
  p_windows int[]
) returns boolean
language plpgsql
as $$
declare
  i      int;
  v_hits int;
  v_ok   boolean := true;
begin
  -- Süresi geçmiş satırları ara sıra topla; ayrı bir cron'a gerek kalmasın.
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '2 hours';
  end if;

  for i in 1 .. coalesce(array_length(p_buckets, 1), 0) loop
    insert into public.rate_limits as r (bucket, window_start, hits)
    values (p_buckets[i], now(), 1)
    on conflict (bucket) do update
      set hits = case
            when r.window_start < now() - make_interval(secs => p_windows[i]) then 1
            else r.hits + 1
          end,
          window_start = case
            when r.window_start < now() - make_interval(secs => p_windows[i]) then now()
            else r.window_start
          end
    returning r.hits into v_hits;

    if v_hits > p_limits[i] then
      v_ok := false;
    end if;
  end loop;

  return v_ok;
end;
$$;

-- RLS: tabloya kimse dokunamaz. Politika yazılmadığı için secret key dışında
-- her rol için tablo kapalı.
alter table public.rate_limits enable row level security;

-- Fonksiyon da anon'a kapalı: açık olsaydı sayaçları kendisi doldurup
-- başkalarını kilitleyebilirdi. Yalnızca /api/oy secret key ile çağırır.
revoke all on function public.rate_hit(text[], int[], int[]) from public, anon, authenticated;
