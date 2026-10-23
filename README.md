# BuyHomestay — MyRehat Task B

Marketplace listing homestay dengan form khusus member, WhatsApp concierge berbasis AI,
dan skrip pemoles deskripsi listing.

- **Web**: Next.js 16 (App Router, standalone output) — `apps/web`
- **API**: Elysia + oRPC — `apps/server`
- **DB**: PostgreSQL + Drizzle ORM — `packages/db` (termasuk auth Better-Auth)
- **Auth**: Better-Auth (email + password), cookie `SameSite=Lax`
- **Monorepo**: Turborepo + Biome + pnpm
- **Deploy**: Docker Compose (web + server), cocok untuk Dokploy

## Fitur

| Kode | Yang dikerjakan | Di mana |
| --- | --- | --- |
| **F1** | Form listing BuyHomestay (title, price, location, kategori 4 opsi, WhatsApp). Hanya user login yang bisa submit, disimpan lewat Drizzle, tampil di halaman list. | `packages/db/src/schema/listing.ts`, `packages/api/src/routers/listing.ts`, `apps/web/src/app/listings/`, `apps/web/src/components/listing-form.tsx` |
| **F2** | Webhook WAHA `POST /api/webhooks/waha` → validasi → `generateText` (OpenRouter) → `{ to, reply }` | `apps/web/src/app/api/webhooks/waha/route.ts`, `apps/web/src/lib/waha.ts`, `apps/web/src/lib/concierge.ts` |
| **F3** | `scripts/polish.ts` memoles deskripsi listing via `ai-sdk-provider-opencode-sdk` (OpenCode 2.x), bisa diuji tanpa server | `scripts/polish.ts`, `scripts/polish-core.ts`, `tests/polish.test.ts` |
| **F4** | Hero heading "Book homestays directly with hosts", layout rapi di 360/390px | `apps/web/src/app/page.tsx` |

### Kategori listing (tepat 4)

`Buy Property`, `Buy land to build homestay`, `Buy Airbnb Profile`, `Buy Airbnb Business`.

Sumber tunggalnya `packages/db/src/categories.ts`. Konstanta itu dipakai untuk enum Postgres,
skema validasi zod di API, dan `<select>` di form — jadi opsi kelima ditolak di semua lapisan,
bukan cuma disembunyikan di UI.

## Menjalankan lokal

```bash
pnpm install
cp .env.example .env            # opsional: lihat daftar variabel di bawah

# PostgreSQL lokal (atau pakai DATABASE_URL milikmu)
docker run --name myrehat-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:17

export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
export BETTER_AUTH_SECRET="dev-secret-min-32-characters-000000"
pnpm db:migrate                 # opsional: server juga otomatis migrate saat start
pnpm dev                        # web :3001, API :3000
```

> Catatan: `apps/*/.env` di repo ini sengaja berisi **placeholder** (dipakai saat build Docker).
> Untuk lokal, timpa lewat environment variable seperti contoh di atas.

Perintah lain:

```bash
pnpm check-types   # tsc untuk semua package (harus bersih)
bunx vitest run    # 36 test
pnpm check         # biome
```

## F2 — WhatsApp concierge

Webhook memakai format WAHA dan tinggal didaftarkan ke URL web yang sama (tidak ada domain API
terpisah):

```bash
curl -X POST https://<domain-dokploy>/api/webhooks/waha \
  -H 'content-type: application/json' \
  -d '{"event":"message","payload":{"from":"60123456789@c.us","body":"Ada homestay di Cameron Highlands?"}}'
```

Respons sukses:

```json
{ "to": "60123456789@c.us", "reply": "..." }
```

Perilaku validasi:

- `event` selain `message` (mis. `session.status`) → `400 {"error":"unsupported event: ..."}`
- `payload.from`/`payload.body` hilang atau kosong → `400`
- `fromMe: true` (pesan dari bot sendiri) → diabaikan supaya tidak terjadi loop balasan
- JSON rusak → `400`
- `OPENROUTER_API_KEY` kosong atau provider gagal → tetap `200` dengan pesan fallback,
  supaya WAHA tidak retry berulang-ulang

Model diambil dari `OPENROUTER_MODEL` (default `google/gemini-2.5-flash`; isi dengan model
`:free` pilihanmu di OpenRouter).

## F3 — Poles deskripsi listing

Butuh server OpenCode 2.x (provider `ai-sdk-provider-opencode-sdk` v5):

```bash
OPENCODE_PASSWORD=secret npx @opencode/cli@2.0.24 serve --port 4096

bun run scripts/polish.ts \
  --title "3-bedroom homestay near Tanah Rata" \
  --category "Buy Property" \
  --description "rumah 3 bilik, ada air panas, dekat pasar malam, boleh muat 8 orang"
```

Logika inti (`scripts/polish-core.ts`) menerima callback `generate`, jadi unit test memakai mock:
prompt berisi title/kategori/deskripsi asli, output dibersihkan dari code fence/tanda kutip,
retry sekali kalau model mengembalikan teks kosong, dan input terlalu pendek ditolak sebelum
memanggil model.

## Deploy (Dokploy)

Dua container dari `docker-compose.yml`:

| Service | Port internal | Keterangan |
| --- | --- | --- |
| `web` | 3001 | Next.js standalone, juga host webhook WAHA |
| `server` | 3000 | Elysia + oRPC + Better-Auth, menjalankan migrasi saat start |

Tidak ada `ports:` yang di-publish — Dokploy yang memetakan domain ke `web:3001`.

Environment yang harus diisi di Dokploy:

| Variabel | Service | Contoh |
| --- | --- | --- |
| `DATABASE_URL` | server | `postgres://user:pass@host:5432/db` |
| `BETTER_AUTH_SECRET` | server | string acak ≥ 32 karakter |
| `BETTER_AUTH_URL` | server | `https://<domain>` |
| `CORS_ORIGIN` | server | `https://<domain>` (origin web, dipakai `trustedOrigins`) |
| `OPENROUTER_API_KEY` | web | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | web | model `:free`, mis. `google/gemini-2.5-flash` |
| `NEXT_PUBLIC_SERVER_URL` | web (build arg) | `https://<domain>` |

`apps/web/.env` dan `apps/server/.env` yang di-commit hanya placeholder untuk build; nilai
asli selalu diinject Dokploy.

### Kenapa ada 5 patch scaffold

1. **`.env` dummy** — `next build` dan `varlock` butuh variabel saat build; tanpa file ini build gagal.
2. **`msgpackr-extract` di `allowBuilds`** — dependency native dari provider OpenCode (F3);
   pnpm 10 memblokir build script secara default sehingga `pnpm install` gagal total.
3. **`docker-compose.yml`** — `ports:` bentrok dengan port Dokploy, dan env runtime harus
   berasal dari panel Dokploy (bukan nilai hardcode).
4. **Rewrite `/rpc` + `/api/auth`** — browser memanggil origin yang sama, Next mem-proxy ke
   container `server`. Cookie session jadi first-party (bukan third-party) dan tidak butuh CORS.
5. **Cookie `sameSite: "lax"`, `secure: false`** — scaffold memakai `none`/`secure`, yang tidak
   akan pernah tersimpan di deployment http.

## Struktur

```
apps/web        Next.js (UI, form listing, webhook WAHA)
apps/server     Elysia (oRPC, Better-Auth, migrasi saat boot)
packages/api    router oRPC + skema validasi
packages/db     Drizzle schema, repository, migrasi SQL
packages/auth   konfigurasi Better-Auth
packages/ui     komponen UI bersama
scripts         polish.ts + polish-core.ts (F3)
tests           vitest: webhook, kategori, format balasan, polish
```

Prompt log pengerjaan: [`PROMPT-LOG.md`](./PROMPT-LOG.md). Catatan verifikasi: [`VERIFICATION.md`](./VERIFICATION.md).
