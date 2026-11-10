# Homework 2 — Uji webhook WAHA dengan curl

Endpoint: `POST /api/webhooks/waha` (berjalan di app web, port 3001).

## 1) Body kosong → 400

```bash
curl -s -w '\nHTTP %{http_code}\n' -X POST http://localhost:3001/api/webhooks/waha
```

Output:

```
{"error":"Invalid JSON body"}
HTTP 400
```

Catatan: body `{}` juga ditolak 400 dengan pesan field yang hilang, mis.
`{"error":"event: Invalid input: expected string, received undefined"}`.

## 2) Payload valid → 200, dibalas concierge

```bash
curl -s -w '\nHTTP %{http_code}\n' -X POST http://localhost:3001/api/webhooks/waha \
  -H 'content-type: application/json' \
  -d '{"event":"message","payload":{"from":"60123456789@c.us","body":"Ada homestay di Cameron Highlands?"}}'
```

Output:

```
{"to":"60123456789@c.us","reply":"Thanks for reaching out to BuyHomestay! Our concierge is a little busy right now — please try again in a moment, or browse listings at /listings."}
HTTP 200
```

## Kenapa balasannya fallback

`OPENROUTER_API_KEY` di environment lokal masih kosong, jadi
`generateConciergeReply()` mengembalikan `FALLBACK_REPLY` (mock) dengan status
**200**. Ini disengaja: WAHA tidak boleh retry terus-menerus saat provider AI
sedang tidak tersedia.

Kalau `OPENROUTER_API_KEY` diisi, jalur yang sama memanggil OpenRouter
(`OPENROUTER_MODEL`, default `google/gemini-2.5-flash`) dan mengembalikan teks
dari model. Bentuk respons tetap `{ to, reply }`.

## Perilaku validasi lain

| Input | Hasil |
| --- | --- |
| Body kosong / JSON rusak | `400 {"error":"Invalid JSON body"}` |
| `event` bukan `message` | `400 {"error":"unsupported event: ..."}` |
| `payload.from` atau `payload.body` kosong | `400` dengan nama field |
| `fromMe: true` | diabaikan, tidak dibalas (anti-loop) |
| `body` > 4000 karakter | `400` |
