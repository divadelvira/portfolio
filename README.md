# Portofolio Diva Delvira

Portofolio bilingual React + Vite. Konten dapat diedit melalui **Decap CMS di `/admin`**; form kontak tetap menggunakan Firebase.

## Menjalankan proyek

```sh
npm ci
npm run dev
```

Buka `http://localhost:3000`. Untuk editor lokal, jalankan `npx decap-server` di terminal terpisah, lalu buka `http://localhost:3000/admin`.

## Pemeriksaan

```sh
npm run lint
npm run build
npm run check:cms
# Perlu npm run dev di terminal lain dan Google Chrome terpasang:
npm run check:cms:ui
```

`build` juga memvalidasi kecocokan konfigurasi CMS dengan konten JSON. Tidak ada dependency runtime CMS baru di aplikasi; bundle editor hanya dimuat pada `/admin` dengan versi dan integrity hash yang dipatok.

## Mengedit dan menerbitkan konten

Panduan pemilik website, setup GitHub OAuth, environment variables Vercel, dan langkah rilis ada di **[docs/cms.md](docs/cms.md)**.

Konten tersimpan di `src/content/*.json`; unggahan CMS masuk ke `public/uploads`. Editor produksi membuat commit ke `main`, lalu Vercel membangun ulang website. Implementasi di `dev` perlu dirilis ke `main` sebelum editor produksi dapat dipakai.
