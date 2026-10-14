# Decap CMS editing

Production CMS URL: `https://portfolio-divadelvira.vercel.app/admin`.

## Owner editing steps

1. Open `https://portfolio-divadelvira.vercel.app/admin`.
2. Click **Login with GitHub** and approve the app for `divadelvira/portfolio`.
3. Choose a section in website order: **Beranda**, **Tentang saya**, **Pengalaman**, **Proyek**, **Kompetensi**, **Penghargaan**, **Pendidikan**, **Pelatihan**, **Kontak**, then **Teks dan pengaturan**. Bilingual fields show English and Bahasa Indonesia together; use image fields to upload photos.
4. Use **Tambah** to add list entries, drag entries to reorder, and remove entries to delete. Core sections cannot be deleted. Projects, awards, rotating roles, experience, training, and their photos are stored with each item's stable internal ID, so moving an item keeps its evidence attached.
5. Click **Simpan**, then **Simpan perubahan** in its menu. The production GitHub backend commits changes to `main`; wait for the Vercel redeploy, then refresh the public site.

Indonesian quick guide for Diva:

1. Buka `https://portfolio-divadelvira.vercel.app/admin`.
2. Masuk dengan GitHub akun pemilik repo `divadelvira/portfolio`.
3. Pilih bagian yang ingin diubah. Isi kolom **English** dan **Bahasa Indonesia** bila kontennya bilingual; klik kolom gambar untuk mengunggah foto.
4. Gunakan **Tambah** untuk menambah daftar, seret untuk mengurutkan, dan hapus entri yang tidak diperlukan. Bagian utama tidak dapat dihapus; bukti foto tetap melekat pada entri melalui ID internal yang stabil.
5. Klik **Simpan**, lalu **Simpan perubahan** pada menu yang muncul; tunggu Vercel selesai deploy.

## Local editing

Untuk mencoba di komputer sendiri, cukup satu perintah:

```sh
npm ci       # setelah clone atau jika dependency baru belum terpasang
npm run dev
```

Buka **http://localhost:3000/admin**. `npm run dev` otomatis menyalakan Vite di port 3000 dan Decap lokal di port 8081; tidak perlu akun atau OAuth GitHub. Klik **Masuk** lokal bila diminta, edit konten, lalu **Simpan** untuk menyimpan ke file proyek. Lihat hasilnya di http://localhost:3000.

Mode lokal menggunakan filesystem: **tidak membuat commit, tidak push, dan tidak mengubah website online**. Perubahan tersimpan di `src/content/*.json` serta `public/uploads`; cek dengan `git diff` sebelum commit. Kedua server terikat ke `127.0.0.1`, bukan jaringan publik. Tekan **Ctrl+C** pada terminal dev untuk menghentikan keduanya. Port 3000 dan 8081 harus bebas; jika salah satu server gagal, runner menghentikan server lainnya.

Untuk mengecek startup otomatis, hentikan server dev dulu lalu jalankan `npm run check:dev`. Pengujian ini tidak mengubah konten.

Untuk menguji penyimpanan sungguhan, jalankan `npm run check:cms:save` setelah `npx playwright install chromium` (sekali untuk menyiapkan browser). Tes membuka Decap di salinan sementara, mengubah nama tanpa mengubah gambar, memilih **Simpan → Simpan perubahan**, memeriksa file dan website lokal setelah reload, lalu mengembalikan nama awal. Konten checkout dan production tidak disentuh. Tes memerlukan akses CDN Decap; port 3000 dan 8081 harus bebas.

Validasi path gambar dilakukan pada nilai asli di `preSave`, karena widget gambar Decap 3.16.3 menerapkan `pattern` hanya pada nama file. `npm run check:cms` juga memeriksa pola pada konten sumber; keduanya tidak menggantikan tes simpan browser. GitHub Actions menjalankan checks ini pada push dan PR ke `dev`/`main`.

## GitHub OAuth App setup

Create one GitHub OAuth App for the production site:

- **Application name:** `Diva Portfolio CMS`
- **Homepage URL:** `https://portfolio-divadelvira.vercel.app`
- **Authorization callback URL:** `https://portfolio-divadelvira.vercel.app/api/callback`

Copy the app values into Vercel environment variables:

```sh
OAUTH_GITHUB_CLIENT_ID=<GitHub OAuth Client ID>
OAUTH_GITHUB_CLIENT_SECRET=<GitHub OAuth Client Secret>
CMS_SITE_URL=https://portfolio-divadelvira.vercel.app
```

`CMS_SITE_URL` is optional in code because production defaults to `https://portfolio-divadelvira.vercel.app`, but if it is set it must be exactly the same origin used by `public/admin/config.yml` `backend.base_url`.

## Vercel release steps

1. Create the GitHub OAuth App, then add the variables above in Vercel for Production.
2. Push implementation changes to `dev` first.
3. Merge `dev` into `main`; ensure Vercel's Production Branch is `main` and its build command is `npm run build`.
4. Wait for that production deployment, or redeploy if the variables were added afterward.
5. Test `/admin` login, publish a small text change, and confirm the public site updates after Vercel deploys.

## Catatan untuk pemilik website

- **Beranda:** identitas, gambar hero, metrik, dan daftar profesi berputar bilingual.
- **Tentang saya / Pengalaman:** foto dan riwayat pekerjaan; daftar pengalaman dapat ditambah, dihapus, dan diurutkan.
- **Proyek / Penghargaan:** setiap entri dikelola sekali untuk kedua bahasa; masing-masing bahasa tetap memiliki teks, tautan, dan foto sendiri. Foto bukti ikut entri saat diurutkan.
- **Kompetensi / Pelatihan / Pendidikan:** sorotan kompetensi, radar, sertifikasi, kegiatan akademik, dan detail TA.
- **Kontak / Teks dan pengaturan:** kontak publik, label bilingual, SEO, dan informasi presentasi. Sembilan bagian utama memiliki satu berkas konten; **Teks dan pengaturan** mengelola beberapa berkas.
- Perubahan tidak langsung muncul saat mengetik: klik **Simpan**, tunggu deploy Vercel, lalu refresh. Jangan memasukkan kata sandi atau data pribadi rahasia ke konten publik.

Untuk hasil proyek tunggal, isi **Nilai hasil**. Untuk hasil sebelum-sesudah, kosongkan **Nilai hasil**, isi **Sebelum**, **Sesudah**, dan **Perbandingan sesudah / sebelum** (misalnya `8 / 12 = 0.667`). Jangan mengubah field ID internal: ID menjaga identitas entri dan mencegah foto bukti berpindah ke item yang berbeda.

CMS ini terpisah dari login inbox Firebase yang sudah ada; kredensial inbox tidak dipakai untuk CMS.

## Security notes

- `/api/auth` requests GitHub scope `repo` only.
- `/api/callback` exchanges the code server-side; the GitHub token is sent only through the Decap popup `postMessage` handshake, never in the URL.
- OAuth state is stored in an HttpOnly, Secure, SameSite=Lax cookie with a short expiry.
- The OAuth origin is fixed to `https://portfolio-divadelvira.vercel.app` unless `CMS_SITE_URL` is explicitly set to another HTTPS origin.
