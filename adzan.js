// --- Konfigurasi ---
// Lokasi Default (Jika deteksi lokasi gagal, kita pakai Jakarta)
const DEFAULT_LATITUDE = -6.2088; 
const DEFAULT_LONGITUDE = 106.8456;
const PRAYER_API = "https://api.aladhan.com/v1/timings";
// Metode perhitungan (Misal: 3=Muslim World League, 11=Kemenag RI - ganti sesuai kebutuhan)
const METHOD = 3; 

// --- Elemen DOM ---
const scheduleDiv = document.getElementById('prayer-schedule');
const locationDisplay = document.getElementById('location-display');
const azanStatus = document.getElementById('azan-status');
const azanAudio = document.getElementById('azan-audio');
const playButton = document.getElementById('play-button');

// --- Variabel Global ---
let prayerTimesToday = {};
let currentLatitude = DEFAULT_LATITUDE;
let currentLongitude = DEFAULT_LONGITUDE;

// Waktu salat yang ingin ditampilkan (Fajr, Dhuhr, Asr, Maghrib, Isha)
const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];


// ===============================================
// Bagian 1: Deteksi Lokasi Otomatis
// ===============================================

function getLocation() {
    locationDisplay.textContent = 'Mendeteksi lokasi... (Mohon berikan izin lokasi)';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Sukses
                currentLatitude = position.coords.latitude;
                currentLongitude = position.coords.longitude;
                locationDisplay.textContent = Lokasi: Lintang ${currentLatitude.toFixed(4)}, Bujur ${currentLongitude.toFixed(4)};
                fetchPrayerTimes();
            },
            (error) => {
                // Gagal/Ditolak
                console.warn('Gagal mendapatkan lokasi. Menggunakan lokasi default (Jakarta).', error);
                locationDisplay.textContent = 'Lokasi: Default (Jakarta). Izinkan lokasi untuk hasil akurat.';
                fetchPrayerTimes();
            }
        );
    } else {
        // Browser tidak mendukung
        locationDisplay.textContent = 'Geolocation tidak didukung browser Anda. Menggunakan lokasi default (Jakarta).';
        fetchPrayerTimes();
    }
}


// ===============================================
// Bagian 2: Mengambil dan Menampilkan Jadwal Salat
// ===============================================

async function fetchPrayerTimes() {
    scheduleDiv.innerHTML = '<p>Memuat jadwal salat...</p>';
    
    const date = new Date();
    // Format tanggal untuk API
    const formattedDate = ${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()};
    
    const url = ${PRAYER_API}/${formattedDate}?latitude=${currentLatitude}&longitude=${currentLongitude}&method=${METHOD};

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(Gagal mengambil data jadwal salat: ${response.statusText});
        }
        
        const data = await response.json();
        
        // Filter hanya waktu-waktu yang kita butuhkan
        prayerTimesToday = PRAYER_NAMES.reduce((acc, name) => {
            if (data.data.timings[name]) {
                acc[name] = data.data.timings[name];
            }
            return acc;
        }, {});

        displayPrayerTimes();
        // Mulai pengecekan waktu azan
        startAzanChecker(); 

    } catch (error) {
        scheduleDiv.innerHTML = <p style="color: red;">Error: Gagal memuat jadwal salat. ${error.message}</p>;
        console.error("Error fetching prayer times:", error);
    }
}

function displayPrayerTimes() {
    let html = '';
    
    // Looping melalui waktu salat yang sudah difilter
    for (const [prayer, time] of Object.entries(prayerTimesToday)) {
        html += `
            <div class="prayer-time">
                <span>${prayer}</span>
                <span id="time-${prayer}">${time}</span>
            </div>
        `;
    }
    
    scheduleDiv.innerHTML = html;
}


// ===============================================
// Bagian 3: Suara Azan Otomatis
// ===============================================

function startAzanChecker() {
    // Pengecekan pertama saat start
    checkPrayerTime(); 
    // Kemudian, jalankan pengecekan setiap 30 detik (agar lebih responsif)
    setInterval(checkPrayerTime, 30000); 
    
    // Pasang event listener untuk tombol manual (jika diperlukan)
    playButton.addEventListener('click', () => {
        azanAudio.play()
            .then(() => {
                playButton.style.display = 'none';
            })
            .catch(e => console.error("Gagal memutar azan secara manual:", e));
    });
}

function checkPrayerTime() {
    const now = new Date();
    // Format waktu saat ini menjadi HH:MM
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    
    let nextPrayerName = null;
    let minDiff = Infinity; 
    let prayerOccurred = false; // Flag untuk memastikan kita tidak cek azan berulang
    
    for (const [prayer, time] of Object.entries(prayerTimesToday)) {
        const [h, m] = time.split(':').map(Number);
        const prayerMinutes = h * 60 + m;
        
        const diff = prayerMinutes - currentTimeMinutes;

        // Cek apakah waktu salat sudah tiba (dalam jendela 0-1 menit)
        if (diff >= 0 && diff < 1 && !prayerOccurred) { 
            playAzan(prayer);
            prayerOccurred = true;
            
            // Tandai waktu salat di UI
            const timeEl = document.getElementById(time-${prayer});
            if(timeEl) {
                timeEl.style.color = 'red';
                timeEl.style.fontWeight = 'bold';
            }
        }
        
        // Cek untuk menentukan sholat berikutnya
        if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            nextPrayerName = prayer;
        }
    }
    
    // Update status azan
    if (nextPrayerName) {
        azanStatus.textContent = Adzan berikutnya: ${nextPrayerName} dalam ${minDiff} menit.;
    } else {
        azanStatus.textContent = Semua salat hari ini sudah berlalu.;
    }
}

function playAzan(prayerName) {
    console.log(Waktu ${prayerName} telah tiba! Memutar Adzan...);
    azanStatus.textContent = !!! ADZAN ${prayerName} !!!;
    azanAudio.currentTime = 0; // Mulai dari awal
    
    azanAudio.play()
        .then(() => {
            console.log("Adzan berhasil diputar secara otomatis.");
            playButton.style.display = 'none'; // Sembunyikan tombol
        })
        .catch(error => {
            console.error("Gagal memutar Adzan otomatis. Perlu interaksi pengguna:", error);
            // Tampilkan tombol untuk interaksi manual
            playButton.textContent = Klik untuk memutar Adzan ${prayerName};
            playButton.style.display = 'block'; 
        });
}


// --- Inisialisasi Aplikasi ---
getLocation();
