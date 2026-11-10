# Homework — Bukti pengerjaan

Dua permintaan follow-up setelah interview:

1. [Validasi kategori](./category-validation.md) — opsi di luar 4 kategori resmi
   ditolak dengan pesan jelas + screenshot vitest hijau.
2. [Uji webhook dengan curl](./webhook-curl.md) — body kosong `400`, payload
   valid `200` dengan balasan concierge (fallback/mock saat API key kosong).

## Ringkasan perubahan kode

| File | Perubahan |
| --- | --- |
| `tests/listing-categories.test.ts` | Assert pesan error memuat aturan + keempat kategori resmi; tambah case kategori kosong. |
| `apps/web/src/components/listing-form.tsx` | Tampilkan `issues[0].message` dari server, bukan hanya `"Input validation failed"`. |
| `docs/homework/vitest-categories.png` | Screenshot hasil run vitest (11 passed). |

## Perintah reproduksi

```bash
bunx vitest run tests/listing-categories.test.ts --reporter=verbose
bunx vitest run
pnpm check-types
```

Webhook (server lokal harus hidup):

```bash
curl -s -w '\nHTTP %{http_code}\n' -X POST http://localhost:3001/api/webhooks/waha
curl -s -w '\nHTTP %{http_code}\n' -X POST http://localhost:3001/api/webhooks/waha \
  -H 'content-type: application/json' \
  -d '{"event":"message","payload":{"from":"60123456789@c.us","body":"Ada homestay di Cameron Highlands?"}}'
```
