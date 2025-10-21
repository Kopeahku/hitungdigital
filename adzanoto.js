// Koordinat contoh (Jakarta): Ganti dengan koordinat lokasi Anda
const LATITUDE = -6.2088; 
const LONGITUDE = 106.8456;
const TIME_OFFSET_MINUTES = 2; // Beri waktu 2 menit sebelum adzan untuk notifikasi (opsional)

const today = new Date();
const year = today.getFullYear();
const month = today.getMonth() + 1; // Bulan 1-12

// Fungsi untuk mendapatkan waktu sholat dari API
async function getPrayerTimes() {
    const url = `http://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${LATITUDE}&longitude=${LONGITUDE}&method=5`; // Metode 5 (Egyptian General Authority of Survey)

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Ambil data waktu sholat untuk hari ini
        const dailyData = data.data.find(d => {
            // Konversi tanggal API (DD-MM-YYYY) ke objek Date
            const apiDate = d.date.gregorian.date; 
            return new Date(apiDate).toDateString() === today.toDateString();
        });

        if (dailyData) {
            return dailyData.timings;
        }
        throw new Error("Data waktu sholat hari ini tidak ditemukan.");

    } catch (error) {
        console.error("Gagal mengambil waktu sholat:", error);
        document.getElementById('prayer-times').innerHTML = "Gagal memuat waktu sholat.";
        return null;
    }
}

// Fungsi utama untuk memeriksa dan memutar Adzan
async function checkAdzan() {
    const timings = await getPrayerTimes();
    if (!timings) return;

    const adzanSound = document.getElementById('adzan-sound');
    const display = document.getElementById('prayer-times');

    // Daftar sholat yang ingin dicek (sesuaikan kunci dari API)
    const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    let htmlOutput = "<ul>";

    prayerNames.forEach(name => {
        // Waktu dari API berbentuk "HH:MM (TZ)"
        const timeString = timings[name].split(' ')[0]; 
        const [hours, minutes] = timeString.split(':').map(Number);

        // Buat objek Date untuk waktu sholat hari ini
        const prayerTime = new Date(today);
        prayerTime.setHours(hours, minutes, 0, 0); // Atur jam, menit, detik, milidetik

        // Hitung waktu notifikasi (misal 2 menit sebelumnya)
        const notificationTime = new Date(prayerTime.getTime() - (TIME_OFFSET_MINUTES * 60000));

        const now = new Date();

        // Cek apakah waktu saat ini sudah melewati waktu notifikasi
        if (now >= notificationTime && now < prayerTime) {
            display.innerHTML = `**Waktunya ${name} hampir tiba!** (${timeString})`;
        }

        // Cek apakah waktu saat ini sudah mencapai waktu Adzan (atau sedikit setelahnya)
        if (now >= prayerTime && now <= new Date(prayerTime.getTime() + 60000)) { // Cek dalam rentang 1 menit
            display.innerHTML = `**ALLAHU AKBAR! Waktunya ${name}!**`;
            console.log(`Memainkan Adzan untuk ${name}`);
            adzanSound.play().catch(e => console.error("Gagal memutar Adzan (perlu interaksi user):", e));
        }

        htmlOutput += `<li>${name}: ${timeString}</li>`;
    });

    htmlOutput += "</ul>";
    display.innerHTML = htmlOutput;
}

// Jalankan pengecekan setiap 10 detik
checkAdzan(); 
setInterval(checkAdzan, 10000); // 10000ms = 10 detik

// Catatan: Browser modern memerlukan INTERAKSI USER (klik tombol)
// sebelum sebuah suara (audio) dapat diputar secara otomatis.
// Anda mungkin perlu menambahkan tombol "Mulai Aplikasi" untuk mengatasi batasan ini.
