// Deklarasi Global
let isAdzanActivated = false;
let checkInterval; // Variabel untuk menyimpan interval agar bisa dihentikan

// Konstanta dan Konfigurasi (Sama seperti sebelumnya)
const LATITUDE = -6.2088; // Jakarta
const LONGITUDE = 106.8456;
const TIME_OFFSET_MINUTES = 2; 

// Elemen HTML
const activationButton = document.getElementById('activation-button');
const statusMessage = document.getElementById('status-message');
const adzanSound = document.getElementById('adzan-sound');

// --- Fungsi 1: Mendapatkan Waktu Sholat (Sama seperti sebelumnya) ---
async function getPrayerTimes() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const url = http://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${LATITUDE}&longitude=${LONGITUDE}&method=5; 

    // ... (Logika fetch API sama persis di sini) ...
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const dailyData = data.data.find(d => {
            const apiDate = d.date.gregorian.date; 
            return new Date(apiDate).toDateString() === today.toDateString();
        });

        if (dailyData) {
            return dailyData.timings;
        }
        return null;
        
    } catch (error) {
        console.error("Gagal mengambil waktu sholat:", error);
        document.getElementById('prayer-times').innerHTML = "Gagal memuat waktu sholat.";
        return null;
    }
}

// --- Fungsi 2: Logika Pengecekan Adzan (Inti aplikasi) ---
async function checkAdzan() {
    const timings = await getPrayerTimes();
    if (!timings) return;

    const display = document.getElementById('prayer-times');
    const today = new Date();

    const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    let htmlOutput = "<ul>";

    prayerNames.forEach(name => {
        const timeString = timings[name].split(' ')[0]; 
        const [hours, minutes] = timeString.split(':').map(Number);
        
        const prayerTime = new Date(today);
        prayerTime.setHours(hours, minutes, 0, 0);

        const notificationTime = new Date(prayerTime.getTime() - (TIME_OFFSET_MINUTES * 60000));
        
        const now = new Date();
        
        let status = '';
        let isAdzanTime = false;

        // Cek Notifikasi (SEBELUM ADZAN)
        if (now >= notificationTime && now < prayerTime) {
            status = **(${name} hampir tiba!)**;
        }

        // Cek Waktu Adzan
        if (now >= prayerTime && now <= new Date(prayerTime.getTime() + 60000)) { // Dalam rentang 1 menit
            status = **ALLAHU AKBAR! Waktunya ${name}!**;
            isAdzanTime = true;
        }

        // Pengecekan & Pemutaran Suara
        if (isAdzanTime && isAdzanActivated) {
            console.log(Memainkan Adzan untuk ${name});
            // Menggunakan .then().catch() untuk menangani potensi error pemutaran
            adzanSound.play().then(() => {
                // Berhasil diputar
                console.log("Adzan berhasil diputar.");
            }).catch(e => {
                // Gagal, biasanya karena kebijakan browser
                console.error("Gagal memutar Adzan (Browser policy):", e);
                // Matikan interval agar tidak mencoba lagi jika gagal
                clearInterval(checkInterval); 
                display.innerHTML = <span style="color: red;">ERROR: Gagal memutar Adzan. Reload halaman dan coba aktifkan lagi.</span>;
            });
        }
        
        htmlOutput += <li>${name}: ${timeString} ${status}</li>;
    });
    
    htmlOutput += "</ul>";
    display.innerHTML = htmlOutput;
}

// --- Fungsi 3: Handler Tombol Aktivasi ---
function activateAdzan() {
    // 1. Coba Putar Suara Senyap atau Singkat (untuk mendapatkan izin)
    adzanSound.volume = 0; // Set volume ke 0
    adzanSound.play().then(() => {
        // Jika berhasil, browser telah memberikan izin pemutaran
        isAdzanActivated = true;
        adzanSound.volume = 1; // Kembalikan volume normal
        
        // Sembunyikan tombol dan tampilkan pesan sukses
        activationButton.style.display = 'none';
        statusMessage.style.color = 'green';
        statusMessage.innerHTML = '✅ Adzan Aktif! Aplikasi sekarang bisa memutar suara otomatis.';

        // 2. Mulai Interval Pengecekan
        checkAdzan(); // Panggil sekali segera
        checkInterval = setInterval(checkAdzan, 10000); // Ulangi setiap 10 detik

    }).catch(e => {
        // Jika gagal (biasanya karena audio tidak bisa diputar bahkan dengan volume 0)
        statusMessage.innerHTML = '❌ Gagal mengaktifkan. Coba klik di tempat lain di halaman dan coba lagi.';
        console.error("Aktivasi gagal:", e);
    });
}

// --- Listener Event ---
activationButton.addEventListener('click', activateAdzan);

// Jalankan checkAdzan sekali saat startup untuk menampilkan jadwal sholat
// Meskipun belum diaktifkan, jadwal tetap ditampilkan.
getPrayerTimes().then(timings => {
    if (timings) {
        // Hanya menampilkan jadwal awal, logika pemutaran ada di checkAdzan()
        document.getElementById('prayer-times').innerHTML = 'Jadwal waktu sholat dimuat. Tekan tombol "Aktifkan Adzan" di atas.';
    }
});
