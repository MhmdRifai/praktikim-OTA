# Praktikum ESP32: Web OTA, Sensor DHT22 & MQ-2, MQTT, dan Web Dashboard

Repository ini berisi kumpulan kode program bertahap untuk mengimplementasikan pembaruan firmware nirkabel (**Web Over-The-Air / OTA**) pada mikrokontroler **ESP32**, pembacaan sensor suhu, kelembapan, dan gas (**DHT22 & MQ-2**), pengiriman telemetri melalui protokol **MQTT**, serta pemantauan data secara *real-time* menggunakan **MQTTX** dan **Web Dashboard** (HTML, CSS, JavaScript).

---

## Struktur Direktori

```text
praktikum-esp32-ota-mqtt/
├── 01_web_ota_dasar/
│   └── 01_web_ota_dasar.ino            # Firmware dasar Web OTA via browser
├── 02_web_ota_blink_led/
│   └── 02_web_ota_blink_led.ino        # Uji coba update OTA untuk LED internal (GPIO 2)
├── 03_web_ota_sensor_dht22_mq2/
│   └── 03_web_ota_sensor_dht22_mq2.ino # Pembacaan DHT22 & MQ-2 dengan tampilan web lokal
├── 04_web_ota_mqtt_dht22_mq2/
│   └── 04_web_ota_mqtt_dht22_mq2.ino   # Integrasi publish data JSON sensor ke Broker MQTT
├── 05_web_dashboard/
│   ├── index.html                      # Struktur halaman dashboard monitoring
│   ├── style.css                       # Styling tampilan dark mode responsif
│   └── script.js                       # Koneksi MQTT over WebSocket & parsing data JSON
└── README.md
```

---

## Kebutuhan Perangkat Keras & Lunak

### Perangkat Keras (Hardware)
* **ESP32 Development Board** (ESP32 DevKit V1 / sejenisnya)
* **Sensor DHT22** (Suhu & Kelembapan)
* **Sensor Gas MQ-2** (Deteksi Asap / Gas Mudah Terbakar)
* **Kabel Jumper & Breadboard**
* **Kabel Data Micro-USB / Type-C** (hanya untuk upload awal)

### Perangkat Lunak & Library
* **Arduino IDE** (dengan Board Package *ESP32 by Espressif Systems*)
* **Library Arduino** (instal melalui *Library Manager* `Ctrl + Shift + I`):
  * `DHT sensor library` oleh **Adafruit** (beserta *Adafruit Unified Sensor*)
  * `PubSubClient` oleh **Nick O'Leary**
* **Visual Studio Code** (untuk mengedit dan menjalankan dashboard web)
* **MQTTX** (aplikasi desktop untuk debugging dan memantau pesan MQTT)

---

## Skema Pengkabelan (Wiring)

| Komponen | Pin Komponen | Pin ESP32 | Keterangan |
| :--- | :--- | :--- | :--- |
| **DHT22** | `VCC` | `3.3V` | Catu daya 3.3V |
| **DHT22** | `GND` | `GND` | Ground |
| **DHT22** | `DATA` | `GPIO 4` | Pembacaan sinyal digital suhu & kelembapan |
| **MQ-2** | `VCC` | `5V / VIN` | Pemanas internal (*heater*) membutuhkan tegangan 5V |
| **MQ-2** | `GND` | `GND` | Ground |
| **MQ-2** | `AO` | `GPIO 34` | Input analog ADC1 (aman digunakan bersamaan dengan Wi-Fi) |
| **LED Internal** | Built-in | `GPIO 2` | Digunakan pada tahap pengujian *blink* |

---

## Penjelasan Tahapan Praktikum

1. **`01_web_ota_dasar`**: Mengaktifkan `WebServer` pada port `80` dan library `Update.h` agar ESP32 menyediakan form unggah file binary (`.bin`) melalui alamat IP lokalnya.
2. **`02_web_ota_blink_led`**: Pengujian pengiriman firmware baru secara nirkabel untuk mengedipkan LED bawaan ESP32 menggunakan `millis()` (non-blocking) agar layanan Web OTA tetap berjalan lancar.
3. **`03_web_ota_sensor_dht22_mq2`**: Membaca suhu dan kelembapan dari DHT22 serta nilai analog gas dari MQ-2 setiap 2 detik, lalu menampilkannya secara otomatis di halaman web ESP32 menggunakan `fetch()` API tanpa me-refresh form upload.
4. **`04_web_ota_mqtt_dht22_mq2`**: Mengirimkan data ketiga parameter sensor dalam format **JSON** ke broker publik EMQX (`broker.emqx.io`) dengan mekanisme *auto-reconnect* non-blocking.
5. **`05_web_dashboard`**: Antarmuka web statis berbasis **MQTT.js** yang terhubung ke broker melalui WebSocket Secure (`wss://broker.emqx.io:8084/mqtt`) untuk menampilkan nilai sensor dan status peringatan gas secara *real-time*.

---

## Cara Penggunaan

### 1. Konfigurasi Wi-Fi & Upload Awal (Kabel USB)
1. Buka file `01_web_ota_dasar/01_web_ota_dasar.ino` di Arduino IDE.
2. Ubah variabel berikut sesuai jaringan Wi-Fi Anda:
   ```cpp
   const char* ssid = "NAMA_WIFI_ANDA";
   const char* password = "PASSWORD_WIFI_ANDA";
   ```
3. Hubungkan ESP32 ke komputer via kabel USB, pilih board dan port COM yang sesuai, lalu klik **Upload**.
4. Buka **Serial Monitor** (`115200 baud`) untuk melihat alamat IP ESP32 (contoh: `http://192.168.100.156`).

### 2. Membuat File Binary (`.ino.bin`) & Update via Web OTA
Untuk tahap 2 hingga tahap 4, upload tidak lagi memerlukan kabel USB:
1. Buka file `.ino` tahap berikutnya di Arduino IDE, sesuaikan `ssid` dan `password`, lalu simpan (`Ctrl + S`).
2. Klik menu **Sketch > Export Compiled Binary** (atau tekan `Ctrl + Alt + S`) dan tunggu hingga proses *compiling* selesai.
3. Buka folder sketch (`Ctrl + K`), masuk ke folder `build/esp32.esp32.esp32/`, dan temukan file berakhiran **`.ino.bin`** *(abaikan file `bootloader.bin` dan `partitions.bin`)*.
4. Buka alamat IP ESP32 di browser (pastikan PC dan ESP32 berada di jaringan Wi-Fi yang sama), pilih file **`.ino.bin`** tersebut, lalu klik **Upload & Update**.

### 3. Pemantauan via MQTTX
Setelah program `04_web_ota_mqtt_dht22_mq2.ino` berjalan di ESP32:
1. Buka aplikasi **MQTTX** dan buat koneksi baru (**New Connection**):
   * **Host:** `broker.emqx.io`
   * **Port:** `1883`
2. Klik **Connect**, lalu klik **+ New Subscription** dan masukkan topik:
   ```text
   testtopic/tugasiot
   ```
3. Ubah format tampilan pesan menjadi **JSON** untuk melihat data yang dikirim ESP32 setiap 2 detik.

### 4. Menjalankan Web Dashboard
1. Buka folder `05_web_dashboard/`.
2. Klik dua kali file **`index.html`** untuk membukanya langsung di browser (atau gunakan ekstensi **Live Server** di VS Code).
3. Pastikan status di pojok kanan atas berubah menjadi **Terhubung ke Broker**.

---

## Format Payload JSON

Data yang dipublikasikan ESP32 ke topik `testtopic/tugasiot` memiliki struktur sebagai berikut:

```json
{
  "suhu": 29.4,
  "kelembapan": 64.2,
  "mq2": 512
}
```

* **`suhu`**: Nilai suhu dalam satuan derajat Celsius (`°C`) dari sensor DHT22 (`null` jika sensor gagal terbaca).
* **`kelembapan`**: Nilai kelembapan relatif (`%`) dari sensor DHT22 (`null` jika sensor gagal terbaca).
* **`mq2`**: Nilai mentah ADC 12-bit (`0` – `4095`) dari sensor gas MQ-2. Nilai di atas `1500` akan memicu status peringatan pada dashboard web.