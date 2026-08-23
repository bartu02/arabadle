-- Al, Sat, Yak — üçlü başına oturum sayacı
--
-- Neden gerekiyor: turlar 70 üçlü arasından rastgele seçilince oylar
-- inceliyor ve hiçbir üçlü eşiği geçemiyor — oyunun asıl ödülü (kalabalığın
-- ne dediği) hiç açılmıyor. Çözüm, tur seçimini eşiğe yakın üçlülere doğru
-- ağırlıklandırmak; bunun için oyun kurulurken üçlü başına oy sayısı lazım.
--
-- Neden fonksiyon, neden JS'te saymıyoruz: PostgREST group by yapmıyor.
-- votes tablosunun tamamını çekip JS'te saymak bugün 66 satırla ucuz ama
-- her /oyna açılışında olacağı için oy sayısıyla birlikte büyür.
--
-- Sayı neden distinct session_id: her oturum bir üçlüdeki üç arabaya da
-- birer oy veriyor (unique kısıtları bunu garanti ediyor), yani araba
-- başına oy sayısı = o üçlüyü oynayan oturum sayısı. Eşik de araba başına
-- bakıyor (lib/votes.js -> MIN_VOTES_FOR_PERCENT).

create or replace function public.trio_vote_counts()
returns table (trio_id uuid, oturum int)
language sql
stable
as $$
  select v.trio_id, count(distinct v.session_id)::int
  from public.votes v
  group by v.trio_id;
$$;

-- votes anon'a tamamen kapalı; toplamı da açmıyoruz. Yalnızca sunucu
-- (secret key) çağırır.
revoke all on function public.trio_vote_counts() from public, anon, authenticated;
