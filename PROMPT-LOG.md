# Prompt log — Task B

Log ini merekam instruksi dan keputusan saat mengerjakan Task B, dalam urutan eksekusi.
Ditulis ulang dari sesi kerja (bukan transkrip mentah) supaya langkah dan alasannya bisa
diikuti. Pengerjaan dibantu AI coding agent, lalu diverifikasi manual dengan test dan build.

---

## Prompt 0 — konteks tugas

```
Saya dapat soal seperti ini bisa bantu saya

TASK B — Next.js (±3-5 jam, boleh paralel dengan A)
Scaffold (copy-paste, jangan diubah kombinasinya):
npx create-better-t-stack@latest myrehat-task-b --frontend next --backend elysia
  --runtime bun --database postgres --orm drizzle --db-setup none --auth better-auth
  --api orpc --payments none --examples ai --addons turborepo biome
  --web-deploy docker --server-deploy docker --package-manager pnpm
  --no-install --no-git --disable-analytics --no-render-title
  --directory-conflict overwrite

Database: Postgres di server mereka (balas MULAI dulu).
AI: OpenRouter (model :free) via OPENROUTER_MODEL.
F1 form listing BuyHomestay ... F2 webhook WAHA ... F3 scripts/polish.ts ...
F4 hero heading ...
Wajib: bunx vitest run, tsc bersih, deploy Dokploy, prompt log.
PENTING — 5 patch wajib sebelum push pertama (tanpa ini deploy gagal).
```

**Tujuan yang saya tetapkan:**

1. Scaffold apa adanya, lalu kelima patch dipasang **sebelum** commit pertama.
2. Semua fitur punya jalur uji tanpa layanan eksternal: validasi dan format balasan adalah
   fungsi murni, pemolesan deskripsi menerima callback `generate` yang bisa di-mock.
3. Verifikasi pakai Postgres sungguhan di lokal + browser sungguhan di 360/390px, bukan
   "sepertinya jalan".
4. Deploy tidak boleh butuh langkah manual di server: skema DB diterapkan saat container start.

---

## Prompt 1 — scaffold + patch

```
Jalankan create-better-t-stack persis seperti brief. Jangan install dulu. Setelah scaffold,
pasang 5 patch wajib, lalu baca struktur yang dihasilkan sebelum menulis fitur.
```

Hasil scaffold: Next 16 + Elysia + oRPC + Better-Auth + Drizzle 1.0 RC + Turborepo,
Dockerfile web/server, `docker-compose.yml`, dan `varlock` untuk validasi env.

Lima patch yang dipasang (urutan sesuai brief):

1. `apps/web/.env` (`NODE_ENV=production`, `NEXT_PUBLIC_SERVER_URL=http://localhost:3000`) dan
   `apps/server/.env` (5 variabel placeholder). Keduanya di-commit dengan `git add -f` karena
   `.gitignore` scaffold mengabaikan `.env`.
2. `pnpm-workspace.yaml` → `allowBuilds: msgpackr-extract: true`.
3. `docker-compose.yml` → hapus `ports:`, ganti semua `NEXT_PUBLIC_SERVER_URL` ke
   `${NEXT_PUBLIC_SERVER_URL:-http://server:3000}`, tambah `OPENROUTER_*` di web dan
   `DATABASE_URL`/`BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` di server.
4. `apps/web/next.config.ts` → rewrite `/rpc/*` dan `/api/auth/*` ke `http://server:3000`.
5. `packages/auth/src/index.ts` → cookie `sameSite: "lax"`, `secure: false`.

Catatan: `docker-compose.yml` memakai BuildKit secret `web_env`/`server_env` yang dibaca dari
file `.env` di host, sedangkan `.dockerignore` mengecualikan `.env` dari `COPY`. Jadi file
placeholder itu memang harus ada di repo, tapi tidak ikut masuk layer image.

---

## Prompt 2 — skema database dan kontrak kategori

```
Kategori harus tepat 4 opsi dan konsisten di DB, API, dan form. Buat satu sumber konstanta,
lalu pakai untuk enum Postgres, skema zod, dan <select>. Harga integer (RM), nomor WhatsApp
dinormalisasi ke digit.
```

Keputusan:

- `packages/db/src/categories.ts` → `LISTING_CATEGORIES` sebagai `as const`.
- `listing.category` memakai `pgEnum("listing_category", LISTING_CATEGORIES)`, bukan `text`
  bebas, supaya opsi kelima juga ditolak oleh database.
- `packages/api/src/schemas/listing.ts` memakai `z.enum(LISTING_CATEGORIES)`; pesan error
  menyebut keempat opsi yang valid.
- Nomor WhatsApp disimpan sebagai digit (`+60 12-345 6789` → `60123456789`) agar link `wa.me`
  selalu valid; form tetap menerima format bertanda hubung/spasi.
- Deskripsi opsional — dipakai oleh F3, bukan syarat submit.

Query Drizzle ditaruh di `packages/db/src/repositories/listing.ts` (bukan di package API).
Alasannya teknis: setelah `drizzle-orm` ditambahkan ke `packages/api`, pnpm memakai dua
instance drizzle dengan peer set berbeda dan `desc(listing.createdAt)` gagal type-check
(`SQL` dari dua instance tidak kompatibel). Menaruh query di package DB menghilangkan duplikasi
itu sekaligus memisahkan akses data dari router.

---

## Prompt 3 — F1 form listing

```
Halaman /listings (publik, grid kartu + tombol WhatsApp) dan /listings/new (khusus login).
Submit lewat oRPC protectedProcedure, jadi pengecekan session terjadi di server, bukan hanya
disembunyikan di UI. Validasi klien memakai skema zod yang sama dengan server.
```

Detail:

- `protectedProcedure` melempar `UNAUTHORIZED` kalau tidak ada session; UI juga menampilkan
  ajakan sign-in supaya pengalaman tidak membingungkan.
- Form memakai `<select>` native (bukan dropdown kustom) karena brief meminta "dropdown tepat
  4 opsi" dan native select paling andal di mobile.
- Setelah sukses: invalidate query list lalu `router.push("/listings")`.
- Kartu listing menampilkan kategori, harga `RM`, lokasi, deskripsi (3 baris), dan tombol
  WhatsApp dengan pesan yang sudah terisi judul listing.

Diuji dengan curl ke API dan dengan Playwright (login → isi form → submit → kartu muncul).

---

## Prompt 4 — F2 webhook WAHA

```
POST /api/webhooks/waha menerima {event, payload:{from, body}}, validasi, panggil generateText,
balas {to, reply}. Route harus ada di app web karena webhook memakai URL Dokploy yang sama.
```

Keputusan:

- Validasi dipisah ke `apps/web/src/lib/waha.ts` (`parseWahaWebhook`, `buildWahaReply`) supaya
  bisa diuji unit tanpa HTTP.
- `event` selain `message` ditolak; `fromMe: true` diabaikan agar bot tidak membalas pesannya
  sendiri (loop).
- Provider gagal / API key kosong → tetap `200` dengan pesan fallback. Kalau dibalas `500`,
  WAHA akan retry terus dan bisa membanjiri provider.
- `buildWahaReply` selalu trim dan tidak pernah mengembalikan `reply` kosong.
- Model: `@openrouter/ai-sdk-provider` + `OPENROUTER_MODEL`, `maxOutputTokens: 400`,
  `maxRetries: 1`.

Diuji live di lokal: payload valid → JSON `{to, reply}`; event salah / body kosong / JSON rusak
→ `400`. Tanpa API key, fallback yang keluar (sesuai desain).

---

## Prompt 5 — F3 skrip polish

```
scripts/polish.ts memakai ai-sdk-provider-opencode-sdk (AI SDK v7, OpenCode 2.x). Pisahkan
logika inti ke polish-core.ts dengan parameter generate, lalu tulis unit test yang mem-mock
provider. CLI menerima --title/--category/--description atau --file.
```

Keputusan:

- `polishListingDescription(input, generate)` tidak mengimpor provider sama sekali → bisa diuji.
- Prompt menyertakan title + kategori + teks asli; output dibersihkan dari code fence dan tanda
  kutip pembungkus.
- Retry sekali bila model mengembalikan teks kosong atau melempar error; setelah itu throw.
- Deskripsi < 10 karakter ditolak sebelum memanggil model (menghemat panggilan dan menghindari
  output mengarang isi).
- CLI memakai `createOpencode({ baseUrl, clientOptions.headers })` dengan Basic auth dari
  `OPENCODE_PASSWORD`, lalu `dispose()` di `finally`.

---

## Prompt 6 — F4 hero + mobile

```
Ganti heading hero menjadi "Book homestays directly with hosts" dan pastikan rapi di mobile.
```

Yang diubah:

- Hero dipindah ke server component (heading tampil di HTML pertama, bukan setelah hydration),
  daftar listing tetap client component (`latest-listings.tsx`).
- Skala heading `text-3xl → sm:text-4xl → md:text-5xl → lg:text-6xl`, `text-balance`,
  tombol full-width di mobile.
- Header jadi sticky dengan nav yang bisa di-scroll horizontal; `main` diberi
  `min-h-0 overflow-y-auto` supaya halaman panjang tetap scroll di dalam grid `h-svh`.
- Tombol yang me-render `<a>`/`<Link>` diberi `nativeButton={false}` (Base UI) agar tidak
  memunculkan error konsol soal semantik tombol.

Diverifikasi Playwright pada 360, 390, dan 1440px: `scrollWidth === clientWidth`,
0 console error, heading tidak terpotong.

---

## Prompt 7 — migrasi otomatis saat deploy

```
Deploy tidak boleh butuh `db:push` manual. Terapkan migrasi Drizzle saat container server start,
idempotent, dan gagal keras kalau migrasi error.
```

- `packages/db/src/migrate.ts` membungkus `migrate()` dari `drizzle-orm/node-postgres/migrator`.
- `apps/server/src/index.ts` menjalankan migrasi sebelum `listen(3000)`; folder default
  `<cwd>/../../packages/db/src/migrations`, bisa ditimpa `MIGRATIONS_DIR`.
- Migrasi SQL di-generate dengan `drizzle-kit generate` dan ikut di-commit, jadi image tidak
  perlu drizzle-kit saat runtime.

Diuji dengan menjalankan bundle produksi (`bun dist/index.mjs`) terhadap Postgres lokal:
tabel `user/session/account/verification/listing` dan enum kategori dibuat otomatis.

---

## Prompt 8 — verifikasi

```
Jalankan tsc untuk semua package, vitest, build produksi, lalu uji end-to-end dengan Postgres
sungguhan: signup, submit listing, unauthorized, empat kategori, webhook valid/invalid.
Cek juga layout mobile di browser.
```

Hasil (detail di `VERIFICATION.md`):

- `pnpm check-types` → 6/6 task sukses.
- `bunx vitest run` → 36 test, 4 file, hijau.
- `pnpm build` → web + server sukses; route `/api/webhooks/waha` terdaftar dinamis.
- E2E: signup 200 + cookie `SameSite=Lax`, create listing 200, create tanpa cookie 401,
  kategori `Rent Property` 400, webhook valid 200 `{to, reply}`, event salah 400.
- Playwright 360/390/1440: tidak ada overflow horizontal, 0 console error.

---

## Masalah yang muncul dan cara memperbaikinya

1. **Dua instance drizzle-orm** setelah `packages/api` mengimpor `drizzle-orm` langsung →
   tipe `SQL` bentrok. Solusi: query dipindah ke package DB (repository), API tidak lagi
   mengimpor drizzle.
2. **Turbo menolak task interaktif non-TTY** (`db:generate`/`db:migrate` dengan `"ui": "tui"`).
   Saat mengembangkan dipakai `pnpm --filter @myrehat-task-b/db db:generate`; di production
   hal ini tidak relevan karena migrasi dijalankan programatik.
3. **`next build` gagal menemukan drizzle** saat migrasi diimpor langsung di server → dipindah
   ke helper package DB.
4. **Rewrite Next di-bake saat build.** `SERVER_URL` tidak dibaca saat runtime untuk rewrites,
   jadi default di `next.config.ts` harus `http://server:3000` (nama service Compose). Ini juga
   alasan build lokal untuk uji harus dijalankan dengan `SERVER_URL=http://localhost:3000`.
5. **Console error Base UI** karena `<Button render={<Link/>}>` → tambah `nativeButton={false}`.
6. **Overflow 4px di mode dev** ternyata dari panel TanStack Query DevTools yang fixed di luar
   viewport. DevTools sekarang hanya dirender saat `NODE_ENV === "development"`, dan build
   produksi diukur ulang: bersih.

---

## Yang tidak dikerjakan AI / butuh keputusan pemilik akun

- Kredensial: `DATABASE_URL`, `BETTER_AUTH_SECRET`, domain Dokploy, dan API key OpenRouter
  diisi di panel deploy (tidak pernah masuk repo).
- Nomor WhatsApp contoh pada data uji adalah dummy; listing asli memakai nomor host.
- Pemilihan model `:free` OpenRouter yang sedang tersedia ditentukan saat deploy.
