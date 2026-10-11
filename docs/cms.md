# Decap CMS editing

Production CMS URL: `https://portfolio-divadelvira.vercel.app/admin`.

## Owner editing steps

1. Open `https://portfolio-divadelvira.vercel.app/admin`.
2. Click **Login with GitHub** and approve the app for `divadelvira/portfolio`.
3. Choose the portfolio section, then edit its fields. Expand **English** or **Bahasa Indonesia** for language-specific content; update both when appropriate. Use image fields to upload photos.
4. Publish the entry using the **Publish** button. Decap commits the change to GitHub's `main` branch.
5. Wait for the Vercel redeploy to finish, then refresh the public site.

Indonesian quick guide for Diva:

1. Buka `https://portfolio-divadelvira.vercel.app/admin`.
2. Masuk dengan GitHub akun pemilik repo `divadelvira/portfolio`.
3. Pilih bagian yang ingin diubah. Isi kolom **English** dan **Bahasa Indonesia** bila kontennya bilingual; klik kolom gambar untuk mengunggah foto.
4. Klik **Publish** untuk menerbitkan perubahan.
5. Tunggu Vercel selesai deploy, lalu cek website utama.

## Local editing

Use local Decap only for content preview while developing:

```sh
npx decap-server
npm run dev
```

Then open `http://localhost:3000/admin`. Local Decap writes to the checkout through `decap-server`; production edits still go through GitHub OAuth.

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

- **Profil, kontak, pendidikan dan pengalaman:** nama, foto, email, media sosial, pendidikan, riwayat kerja, dan organisasi.
- **Proyek portofolio / Penghargaan:** tambah, ubah, hapus, atau urutkan entri. Isi tautan dengan URL HTTPS lengkap.
- **Pelatihan, kompetensi dan tugas akhir:** sertifikasi, keahlian beserta buktinya, kegiatan akademik, serta detail TA.
- **Judul profesi bergantian / Teks halaman dan tombol:** judul animasi di halaman utama dan teks bilingual lainnya.
- Perubahan tidak langsung muncul saat mengetik: klik **Publish**, tunggu deploy Vercel, lalu refresh. Jangan memasukkan kata sandi atau data pribadi rahasia ke konten publik.

Untuk hasil proyek tunggal, isi **Nilai hasil**. Untuk hasil sebelum-sesudah, kosongkan **Nilai hasil**, isi **Sebelum**, **Sesudah**, dan **Perbandingan sesudah / sebelum** (misalnya `8 / 12 = 0.667`).

CMS ini terpisah dari login inbox Firebase yang sudah ada; kredensial inbox tidak dipakai untuk CMS.

## Security notes

- `/api/auth` requests GitHub scope `repo` only.
- `/api/callback` exchanges the code server-side; the GitHub token is sent only through the Decap popup `postMessage` handshake, never in the URL.
- OAuth state is stored in an HttpOnly, Secure, SameSite=Lax cookie with a short expiry.
- The OAuth origin is fixed to `https://portfolio-divadelvira.vercel.app` unless `CMS_SITE_URL` is explicitly set to another HTTPS origin.
