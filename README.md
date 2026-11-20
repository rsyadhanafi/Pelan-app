<div align="center">
  <img src="public/icon-180.png" alt="Logo pelan." width="110" />
  <h1>pelan.</h1>
  <p><strong>Aplikasi Progressive Web App (PWA) untuk membantu menjaga ritme, kesadaran diri, dan pemulihan kebiasaan secara bertahap dan terukur.</strong></p>

  <p>
    <a href="https://pelanid.vercel.app"><strong>🌐 Buka Aplikasi Live (pelanid.vercel.app)</strong></a>
  </p>

  ![React](https://img.shields.io/badge/React-Vite-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-Edge_Functions-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
  ![Vercel](https://img.shields.io/badge/Vercel-Hosted-000000?style=for-the-badge&logo=vercel&logoColor=white)
</div>

---

## Tentang **pelan.**

**pelan.** dirancang sebagai ruang pendamping harian yang tenang, minimalis, dan bebas penghakiman (*non-judgmental*) untuk membantu pengguna membangun kembali kendali diri, memantau pola kebiasaan, serta mengantisipasi momen rawan (*vulnerable hours*) sebelum impuls terjadi.

Alih-alih menuntut perubahan instan yang melelahkan, **pelan.** berfokus pada langkah kecil yang konsisten—menggabungkan pelacakan harian (*daily tracking*), ruang refleksi pemulihan, serta sistem pengingat proaktif berbasis Web Push langsung ke ponsel.

---

## Cara Mengunduh & Memasang di HP (Tanpa Play Store / App Store)

Karena dibangun menggunakan teknologi **Progressive Web App (PWA)**, **pelan.** dapat dipasang langsung ke layar utama (*Home Screen*) ponsel Anda dengan tampilan layar penuh layaknya aplikasi native, ringan, dan hemat penyimpanan.

### 📱 Pengguna Android (Google Chrome)
1. Buka **[https://pelanid.vercel.app](https://pelanid.vercel.app)** melalui browser **Google Chrome**.
2. Ketuk ikon **titik tiga (`⋮`)** di pojok kanan atas layar.
3. Pilih **Tambahkan ke Layar Utama** (*Add to Home Screen*) atau **Instal Aplikasi** (*Install App*).
4. Konfirmasi dengan mengetuk **Instal**, dan ikon **pelan.** akan muncul di layar utama HP Anda.

### 🍎 Pengguna iPhone / iPad (Safari)
1. Buka **[https://pelanid.vercel.app](https://pelanid.vercel.app)** melalui browser **Safari**.
2. Ketuk ikon **Bagikan / Share** (kotak dengan panah ke atas di bagian bawah layar).
3. Gulir ke bawah dan pilih **Tambahkan ke Layar Utama** (*Add to Home Screen*).
4. Ketuk **Tambah** (*Add*) di pojok kanan atas, lalu buka aplikasi dari ikon baru di *Home Screen*.

> **Tips Penting:** Setelah aplikasi terpasang di *Home Screen*, buka aplikasinya, masuk ke menu **Notifikasi**, lalu tekan **Aktifkan Notifikasi HP** dan pilih **Izinkan (Allow)** agar pengingat otomatis dapat masuk tepat waktu.

---

## Fitur Utama & Manfaat

| Fitur | Manfaat bagi Pengguna |
| :--- | :--- |
| **Smart Push Notification (15 Menit Sebelum Jam Rawan)** | Mengirimkan pengingat sadar diri secara otomatis ke HP menjelang jam-jam rawan pengguna, membantu memutus pola impulsif sebelum terjadi. |
| **Pelacakan Konsistensi & Pemulihan Harian** | Memvisualisasikan progres harian secara jujur dan tenang tanpa tekanan berlebihan, sehingga pengguna dapat melihat pola perkembangan dari waktu ke waktu. |
| **Ruang Kerja & Refleksi Terstruktur** | Menyediakan area pencatatan pemicu (*triggers*), evaluasi kondisi diri, dan langkah pemulihan saat menghadapi situasi sulit. |
| **Desain Editorial Minimalis & Responsif** | Antarmuka bersih dengan tipografi nyaman dibaca untuk meminimalkan distraksi dan menjaga ketenangan visual saat digunakan. |
| **Installable PWA & Dukungan Offline** | Dapat diakses cepat langsung dari *Home Screen* ponsel dengan performa ringan layaknya aplikasi mobile native. |

---

## Arsitektur & Teknologi

Aplikasi ini dibangun menggunakan arsitektur modern *serverless* untuk menjamin kecepatan akses dan keandalan pengiriman notifikasi latar belakang:

* **Frontend:** React, TypeScript, Vite, Custom CSS Editorial & Workspace Design System
* **PWA & Service Worker:** Web App Manifest, Custom Service Worker (`public/sw.js`), Web Push API (VAPID)
* **Backend & Database:** Supabase PostgreSQL & Row Level Security (RLS)
* **Automation & Serverless:** Supabase Edge Functions (`cron-push`) yang dijadwalkan secara otomatis setiap 5 menit
* **Deployment:** Vercel Edge Network (`https://pelanid.vercel.app`)

---

## Menjalankan Proyek Secara Lokal (Untuk Developer)

Jika Anda ingin menjalankan atau mengembangkan proyek ini di komputer lokal:

1. **Clone repositori ini:**
   ```bash
   git clone [https://github.com/rsyadhanafi/Pelan-app.git](https://github.com/rsyadhanafi/Pelan-app.git)
   cd Pelan-app
