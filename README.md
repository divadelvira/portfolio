# Portofolio Diva Delvira

Portofolio bilingual React + Vite. Konten dapat diedit melalui **Decap CMS di `/admin`**; form kontak tetap menggunakan Firebase.

## Menjalankan proyek

```sh
npm ci
npm run dev
```

`npm run dev` otomatis menjalankan website dan server CMS lokal. Buka **http://localhost:3000/admin** untuk mengedit tanpa GitHub; website ada di http://localhost:3000. Jika ada tombol masuk lokal, klik **Masuk** tanpa memasukkan akun GitHub.

Klik **Simpan** untuk menyimpan perubahan ke file proyek. Tidak ada commit atau push otomatis; website lokal mengikuti perubahan lewat Vite. Kedua server hanya mendengarkan koneksi lokal. Tekan **Ctrl+C** pada terminal dev untuk menghentikan keduanya.

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

Konten tersimpan satu file per bagian di `src/content/`: `hero.json`, `about.json`, `experience.json`, `projects.json`, `skills.json`, `awards.json`, `education.json`, `training.json`, dan `contact.json`; pengaturan umum berada di berkas terpisah seperti `site.json` dan `metadata.json`. Unggahan CMS masuk ke `public/uploads`. Daftar bilingual proyek, penghargaan, dan profesi dikelola sekali; ID internal stabil menjaga bukti tetap terkait saat urutan berubah. Editor produksi membuat commit ke `main`, lalu Vercel membangun ulang website.
