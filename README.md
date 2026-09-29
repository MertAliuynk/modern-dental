# Karadeniz Diş — yeni arayüz

`dental-frontend-next` sitesinin yeni tasarımlı sürümü. Aynı backend'i
(`https://dentalapi.karadenizdis.com/api`) aynı istek ve cevap biçimleriyle
kullanır; sayfa adresleri eskisiyle aynıdır.

## Çalıştırma

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build && pnpm start
```

## Ortam değişkenleri

SMS sayfaları eski sitede olduğu gibi bu uygulamanın `/api/*` vekil
rotalarından geçer. Bunlar için sunucuda şu değişkenler tanımlı olmalı
(eski sitedekiyle aynı değerler):

- `API_TOKEN` — backend'e SMS/hasta vekil isteklerinde gönderilen token
- `NEXT_PUBLIC_API_BASE_URL` — (opsiyonel) varsayılan `https://dentalapi.karadenizdis.com`

## Notlar

- Randevu takvimindeki hekim sütunlu görünüm FullCalendar Scheduler
  kullanır. `src/lib/appointments.ts` içindeki `SCHEDULER_LICENSE_KEY`
  FullCalendar'ın ticari olmayan kullanım anahtarıdır; ticari kullanım için
  satın alınan anahtarla değiştirilmelidir.
- `src/components/teeth/` altındaki diş şeması SVG'leri eski siteden
  değiştirilmeden alınmıştır.
