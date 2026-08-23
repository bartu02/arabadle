import "server-only";

import { createClient } from "@supabase/supabase-js";

import { checkConfig } from "@/lib/config-check";

let serverClient = null;

/**
 * Sunucu tarafı Supabase istemcisi. Uygulamada Supabase'e giden tek yol bu.
 *
 * Tarayıcı istemcisi yok ve olmamalı: anon rolün votes tablosunda hiçbir
 * yetkisi olmadığı için (0001_init.sql) oy yazmanın tek kapısı /api/oy.
 * Tarayıcıya bir Supabase istemcisi konsaydı o kapı atlanabilir olurdu ve
 * hız sınırı anlamını yitirirdi.
 *
 * Anahtar RLS'i tamamen atlıyor, yani sızması bütün veritabanını verir.
 * Bu dosya "server-only" ile işaretli: bir bileşenden yanlışlıkla import
 * edilirse build hata verir, sessizce bundle'a girmez.
 */
export function getSupabaseServerClient() {
  if (serverClient) return serverClient;

  // Sunucu basina bir kez: yanlis dagitim ayarlarini loga bas.
  checkConfig();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL tanımlı değil.");
  }

  // Üretimde publishable key'e düşmek istemiyoruz: okuma çalışır, oy yazma
  // sessizce ölür ve sorun ancak kullanıcı oynarken fark edilir. Eksikse
  // hemen ve yüksek sesle patlasın.
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SUPABASE_SECRET_KEY tanımlı değil. Oy yazma bu anahtar olmadan çalışmaz."
      );
    }
    throw new Error(
      "SUPABASE_SECRET_KEY tanımlı değil. .env.local dosyasını doldur."
    );
  }

  serverClient = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return serverClient;
}
