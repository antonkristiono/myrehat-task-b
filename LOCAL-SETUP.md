# Menjalankan Task B secara lokal

Database berjalan di Docker (Postgres 17), sedangkan app Next.js + Elysia
dijalankan di host supaya hot reload cepat. File `docker-compose.yml` untuk
Dokploy **tidak diubah**; stack lokal ada di `docker-compose.local.yml`.

## Prasyarat

- Node.js 20+ dan pnpm 10 (`npm i -g pnpm@10.34.7`)
- Bun (`curl -fsSL https://bun.sh/install | bash`)
- Docker + Docker Compose, dengan akses socket Docker

## 1. Database (Docker)

```bash
cd myrehat-task-b
docker compose -f docker-compose.local.yml up -d
```

Postgres mendengarkan di `127.0.0.1:5432`:

```
postgresql://postgres:postgres@localhost:5432/myrehat
```

Data disimpan di volume `myrehat_task_b_pgdata`, jadi aman saat `down`.

## 2. Environment lokal

File `.env` di repo sengaja berisi placeholder untuk build Docker. Untuk lokal,
buat file **git-ignored** `.env.local`:

`apps/server/.env.local`

```dotenv
NODE_ENV=development
BETTER_AUTH_SECRET=local-dev-secret-min-32-characters-0000
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001
GOOGLE_GENERATIVE_AI_API_KEY=placeholder
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myrehat
```

`apps/web/.env.local`

```dotenv
NODE_ENV=development
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
SERVER_URL=http://localhost:3000
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.5-flash
```

Isi `OPENROUTER_API_KEY` dengan key dari <https://openrouter.ai/keys> kalau ingin
balasan concierge benar-benar dari AI. Kalau kosong, webhook tetap membalas
dengan pesan fallback (status 200) supaya WAHA tidak retry terus.

## 3. Install, migrasi, jalankan

```bash
pnpm install

# migrasi Drizzle (sekali / setiap ada migrasi baru)
cd packages/db && pnpm exec drizzle-kit migrate && cd ../..

# SERVER_URL dipakai next.config.ts untuk rewrite /rpc + /api/auth
SERVER_URL=http://localhost:3000 pnpm dev
```

| Service | URL |
| --- | --- |
| Web | <http://localhost:3001> |
| API Elysia | <http://localhost:3000> |
| Webhook WAHA | `http://localhost:3001/api/webhooks/waha` |

Catatan: `pnpm db:migrate` memakai Turbo UI interaktif; kalau dijalankan dari
script non-TTY, pakai perintah `drizzle-kit migrate` di atas.

## 4. Verifikasi

```bash
bunx vitest run     # 36 test
pnpm check-types    # tsc semua package

curl -X POST http://localhost:3001/api/webhooks/waha \
  -H 'content-type: application/json' \
  -d '{"event":"message","payload":{"from":"60123456789@c.us","body":"Ada homestay di Cameron Highlands?"}}'
```

Respons: `200 {"to":"60123456789@c.us","reply":"..."}`.

## 5. Reset database

```bash
docker compose -f docker-compose.local.yml down
docker volume rm myrehat_task_b_pgdata
docker compose -f docker-compose.local.yml up -d
cd packages/db && pnpm exec drizzle-kit migrate && cd ../..
```

Volume `myrehat_task_b_pgdata` sengaja ditandai `external` supaya container yang
sudah ada bisa dipakai ulang; karena itu `down -v` tidak menghapusnya dan perlu
`docker volume rm` seperti di atas.
