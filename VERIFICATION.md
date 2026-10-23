# Catatan verifikasi

Semua angka di bawah diambil dari eksekusi terakhir di mesin lokal (Postgres 18 sungguhan +
Chromium sungguhan), bukan perkiraan.

## 1. Type check

```
$ pnpm check-types
 Tasks:    6 successful, 6 total
```

`tsc -b` untuk `packages/db`, `packages/api`, `packages/auth`, `packages/ui`, lalu
`tsc --noEmit` untuk `apps/server` dan `apps/web`. Tidak ada error.

## 2. Unit test

```
$ bunx vitest run

 ✓ tests/polish.test.ts (10 tests)
 ✓ tests/waha-reply.test.ts (4 tests)
 ✓ tests/waha-webhook.test.ts (12 tests)
 ✓ tests/listing-categories.test.ts (10 tests)

 Test Files  4 passed (4)
      Tests  36 passed (36)
```

Cakupan sesuai brief:

- **Validasi webhook** — payload valid diterima; body kosong, `from` hilang, event bukan
  `message`, `fromMe: true`, body > 4000 karakter, dan JSON rusak ditolak.
- **4 kategori diterima + 1 ditolak** — keempat opsi lolos `createListingSchema`; opsi kelima
  (`Rent Property`) dan kategori kosong gagal. Harga 0/negatif/desimal dan nomor WA tidak valid
  juga ditolak.
- **Format balasan** — `buildWahaReply` mengembalikan tepat `{ to, reply }`, trim, dan memakai
  fallback bila model mengembalikan string kosong.
- **F3 polish** — prompt memuat title/kategori/deskripsi, output dibersihkan, retry saat output
  kosong atau provider error, input terlalu pendek tidak memanggil model.

## 3. Build produksi

```
$ pnpm build
 Tasks:    5 successful, 5 total

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /ai
├ ƒ /api/webhooks/waha
├ ƒ /dashboard
├ ○ /listings
├ ○ /listings/new
└ ○ /login
```

## 4. End-to-end lokal (HTTP)

| Uji | Hasil |
| --- | --- |
| `POST /api/auth/sign-up/email` lewat rewrite web :3001 | `200`, cookie `better-auth.session_token`, `SameSite=Lax` (tanpa `Secure`) |
| `GET /api/auth/get-session` dengan cookie | user `anton@example.com` |
| `POST /rpc/listings/create` dengan cookie | `200`, row tersimpan (harga 450000, WA jadi `60123456789`) |
| `POST /rpc/listings/create` tanpa cookie | `401 UNAUTHORIZED` |
| `POST /rpc/listings/create` kategori `Rent Property` | `400`, pesan menyebut 4 opsi valid |
| `POST /rpc/listings/list` | `200`, listing tampil |
| `POST /api/webhooks/waha` payload valid | `200 {"to":"60123456789@c.us","reply":"..."}` |
| `POST /api/webhooks/waha` event `session.status` | `400 {"error":"unsupported event: session.status"}` |
| `POST /api/webhooks/waha` body kosong / JSON rusak | `400` |
| Migrasi otomatis saat `bun dist/index.mjs` start | `[db] migrations applied ...`, tabel + enum dibuat |

## 5. Layout (Playwright + Chromium)

| Viewport | `scrollWidth` / `clientWidth` | Console error | Heading |
| --- | --- | --- | --- |
| 360×800 | 360 / 360 | 0 | "Book homestays directly with hosts" |
| 390×844 | 390 / 390 | 0 | idem |
| 1440×900 | 1440 / 1440 | 0 | idem |

Form listing (setelah login): dropdown berisi tepat 4 opsi + placeholder "Select a category",
submit mengarah ke `/listings` dan kartu baru muncul dengan link `https://wa.me/60198765432`.

## 6. Bukti file

- Test: `tests/*.test.ts`
- Skema + migrasi: `packages/db/src/migrations/*/migration.sql`
- Screenshot lokal (tidak di-commit): `prod-home-390.png`, `prod-listings-390.png`,
  `form-filled.png`
