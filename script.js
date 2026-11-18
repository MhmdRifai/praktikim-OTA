
/* =====================================
   KONFIGURASI MQTT
===================================== */

const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';
const topic = 'praktikum/iotk100';


/* =====================================
   ELEMENT HTML
===================================== */

const statusBadge = document.getElementById('statusBadge');

const suhuEl = document.getElementById('suhu');
const kelembapanEl = document.getElementById('kelembapan');
const mq2El = document.getElementById('mq2');

const mq2StatusEl = document.getElementById('mq2Status');

const lastUpdateEl = document.getElementById('lastUpdate');
const totalDataEl = document.getElementById('totalData');
const sensorStatusEl = document.getElementById('sensorStatus');

const historyTable = document.getElementById('historyTable');


/* =====================================
   VARIABEL
===================================== */

let totalData = 0;
const maxHistory = 20;


/* =====================================
   MQTT CLIENT
===================================== */

const clientId = 'WebDash-DHT22-' +
    Math.random().toString(16).substring(2, 8);

const client = mqtt.connect(brokerUrl, {
    clientId: clientId,
    clean: true,
    connectTimeout: 10000,
    reconnectPeriod: 3000
});


/* =====================================
   KONEKSI MQTT
===================================== */

client.on('connect', () => {

    console.log('Terhubung ke EMQX Broker');

    statusBadge.textContent = 'Terhubung ke Broker';
    statusBadge.className = 'badge connected';

    client.subscribe(topic, (err) => {

        if (err) {
            console.error('Subscribe gagal:', err);

            statusBadge.textContent = 'Subscribe Error';
            statusBadge.className = 'badge error';

        } else {
            console.log('Berhasil subscribe:', topic);
        }

    });

});


/* =====================================
   MENERIMA DATA SENSOR
===================================== */

client.on('message', (receivedTopic, message) => {

    if (receivedTopic !== topic) {
        return;
    }

    try {

        // Membaca payload JSON
        const data = JSON.parse(message.toString());

        // Mengambil data sensor
        const suhu = Number(data.suhu);
        const kelembapan = Number(data.kelembapan);
        const mq2 = Number(data.mq2);

        // Validasi data
        if (
            !Number.isFinite(suhu) ||
            !Number.isFinite(kelembapan) ||
            !Number.isFinite(mq2)
        ) {
            console.error('Data sensor tidak valid:', data);
            sensorStatusEl.textContent = 'Data tidak valid';
            return;
        }


        /* =============================
           UPDATE DATA DASHBOARD
        ============================= */

        suhuEl.textContent = suhu.toFixed(1);

        kelembapanEl.textContent = kelembapan.toFixed(1);

        mq2El.textContent = mq2;


        /* =============================
           STATUS GAS MQ2
        ============================= */

        let statusGas;

        if (mq2 > 1500) {

            statusGas = 'Bahaya';

            mq2StatusEl.textContent =
                'Peringatan: Gas / Asap Terdeteksi!';

            mq2StatusEl.className = 'gas-status bahaya';

        } else {

            statusGas = 'Aman';

            mq2StatusEl.textContent =
                'Udara Normal / Aman';

            mq2StatusEl.className = 'gas-status aman';

        }


        /* =============================
           WAKTU DAN INFORMASI
        ============================= */

        const now = new Date();

        const waktu = now.toLocaleTimeString('id-ID');

        lastUpdateEl.textContent =
            now.toLocaleString('id-ID');

        sensorStatusEl.textContent = 'Data diterima';


        /* =============================
           UPDATE TOTAL DATA
        ============================= */

        totalData++;

        totalDataEl.textContent = totalData;


        /* =============================
           MASUKKAN KE RIWAYAT
        ============================= */

        tambahRiwayat(
            totalData,
            waktu,
            suhu,
            kelembapan,
            mq2,
            statusGas
        );

        console.log('Data sensor:', data);

    } catch (err) {

        console.error('Format JSON tidak valid:', err);

        sensorStatusEl.textContent = 'Format JSON tidak valid';

    }

});


/* =====================================
   FUNGSI RIWAYAT DATA
===================================== */

function tambahRiwayat(
    no,
    waktu,
    suhu,
    kelembapan,
    mq2,
    statusGas
) {

    // Hapus pesan belum ada data
    if (totalData === 1) {
        historyTable.innerHTML = '';
    }

    // Membuat baris baru
    const row = document.createElement('tr');

    // Data tabel
    const values = [
        no,
        waktu,
        suhu.toFixed(1),
        kelembapan.toFixed(1),
        mq2
    ];

    // Membuat kolom
    values.forEach(value => {

        const cell = document.createElement('td');

        cell.textContent = value;

        row.appendChild(cell);

    });


    // Kolom status gas
    const statusCell = document.createElement('td');

    const badge = document.createElement('span');

    badge.textContent = statusGas;

    badge.className = statusGas === 'Bahaya'
        ? 'table-status bahaya'
        : 'table-status aman';

    statusCell.appendChild(badge);

    row.appendChild(statusCell);


    // Data terbaru berada di paling atas
    historyTable.prepend(row);


    // Maksimal 20 riwayat
    while (historyTable.children.length > maxHistory) {

        historyTable.removeChild(
            historyTable.lastElementChild
        );

    }

}


/* =====================================
   STATUS RECONNECT
===================================== */

client.on('reconnect', () => {

    statusBadge.textContent = 'Menghubungkan ulang...';

    statusBadge.className = 'badge connecting';

});


/* =====================================
   STATUS OFFLINE
===================================== */

client.on('offline', () => {

    statusBadge.textContent = 'Broker Offline';

    statusBadge.className = 'badge error';

});


/* =====================================
   STATUS ERROR
===================================== */

client.on('error', (err) => {

    console.error('MQTT Error:', err);

    statusBadge.textContent = 'Koneksi Error';

    statusBadge.className = 'badge error';

});
