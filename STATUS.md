# Status pengerjaan — Task B

Dokumen ini adalah ringkasan status saat terakhir diperbarui. Untuk detail teknis lihat
[`README.md`](./README.md), [`PROMPT-LOG.md`](./PROMPT-LOG.md), dan [`VERIFICATION.md`](./VERIFICATION.md).

Terakhir diperbarui: 23 Oktober 2026

---

## Sudah jadi & ter-push

**Repo:** https://github.com/antonkristiono/myrehat-task-b (public, branch `master`)

Scaffold dijalankan persis sesuai perintah, lalu **5 patch wajib sudah masuk di commit pertama**:

1. `apps/web/.env` + `apps/server/.env` (placeholder, ikut ter-commit)
2. `pnpm-workspace.yaml` → `msgpackr-extract: true`
3. `docker-compose.yml` → tanpa `ports:`, env dari Dokploy
4. `next.config.ts` → rewrite `/rpc` + `/api/auth` ke `http://server:3000`
5. Cookie Better-Auth → `sameSite: "lax"`, `secure: false`

| Fitur | Status |
| --- | --- |
| **F1** form listing (title, price, location, 4 kategori, WA) — hanya user login, Drizzle, tampil di `/listings` | Selesai |
| **F2** `POST /api/webhooks/waha` → validasi → `generateText` OpenRouter → `{to, reply}` | Selesai (fallback teruji; panggilan AI live butuh API key) |
| **F3** `scripts/polish.ts` + `ai-sdk-provider-opencode-sdk`, diuji dengan mock | Selesai |
| **F4** hero "Book homestays directly with hosts", rapi di 360/390px | Selesai |

## Bukti verifikasi

- `bunx vitest run` → **36 test / 4 file, semua hijau** (validasi webhook, 4 kategori diterima
  + 1 ditolak, format reply, polish)
- `pnpm check-types` → 6/6 task, **tsc bersih**
- `pnpm build` → sukses (route webhook terdaftar dinamis)
- E2E lokal dengan Postgres sungguhan: signup 200 + cookie `SameSite=Lax`, create listing 200,
  tanpa cookie **401**, kategori ke-5 **400**, webhook valid 200, event salah 400
- Playwright 360/390/1440: tidak ada overflow horizontal, **0 console error**
- Migrasi Drizzle jalan otomatis saat server container start

## Yang masih menunggu

Deploy belum bisa dilakukan karena `DATABASE_URL` + app Dokploy baru dibuat setelah balasan
**MULAI**. Teks yang dikirim ke perekrut:

```
MULAI.

Repo: https://github.com/antonkristiono/myrehat-task-b (public)
Mohon kirim DATABASE_URL dan URL app Dokploy setelah dibuat, supaya saya
bisa set environment variable dan verifikasi deploy + webhook di URL live.
```

Yang dibutuhkan setelah itu:

1. **DATABASE_URL** — untuk environment variable di Dokploy
2. **URL Dokploy** — untuk verifikasi live + tes webhook
3. **OpenRouter API key** + model `:free` pilihan — agar balasan concierge benar-benar dari AI

Langkah selanjutnya: set env (`BETTER_AUTH_URL`, `CORS_ORIGIN`, `DATABASE_URL`,
`BETTER_AUTH_SECRET`, `OPENROUTER_*`), pastikan auto-deploy jalan, lalu kirim bukti live
(listing, login, dan respons webhook asli).

## Checklist environment Dokploy

| Variabel | Service | Contoh / catatan |
| --- | --- | --- |
| `DATABASE_URL` | server | dari penyedia database |
| `BETTER_AUTH_SECRET` | server | string acak ≥ 32 karakter |
| `BETTER_AUTH_URL` | server | `https://<domain>` |
| `CORS_ORIGIN` | server | `https://<domain>` |
| `OPENROUTER_API_KEY` | web | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | web | model `:free` |
| `NEXT_PUBLIC_SERVER_URL` | web (build arg) | `https://<domain>` |

## Perintah yang sering dipakai

```bash
pnpm check-types          # tsc semua package
bunx vitest run           # 36 test
pnpm build                # build produksi
pnpm db:generate          # regenerate migrasi Drizzle
bun run scripts/polish.ts --title "..." --description "..."
```
