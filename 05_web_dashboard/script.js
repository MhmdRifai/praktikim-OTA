const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';
const topic = 'praktikum/iotk100';

const statusBadge = document.getElementById('statusBadge');
const suhuEl = document.getElementById('suhu');
const kelembapanEl = document.getElementById('kelembapan');
const mq2El = document.getElementById('mq2');
const mq2StatusEl = document.getElementById('mq2Status');
const lastUpdateEl = document.getElementById('lastUpdate');
const rawJsonEl = document.getElementById('rawJson');

const clientId = 'WebDash-DHT22-' + Math.random().toString(16).substring(2, 8);
const client = mqtt.connect(brokerUrl, {
  clientId: clientId,
  clean: true,
  reconnectPeriod: 3000
});

client.on('connect', () => {
  statusBadge.textContent = 'Terhubung ke Broker';
  statusBadge.className = 'badge connected';
  client.subscribe(topic);
});

client.on('message', (receivedTopic, message) => {
  const payloadStr = message.toString();
  rawJsonEl.textContent = payloadStr;

  try {
    const data = JSON.parse(payloadStr);

    suhuEl.textContent = (data.suhu !== undefined && data.suhu !== null)
      ? Number(data.suhu).toFixed(1) : '--';

    kelembapanEl.textContent = (data.kelembapan !== undefined && data.kelembapan !== null)
      ? Number(data.kelembapan).toFixed(1) : '--';

    if (data.mq2 !== undefined && data.mq2 !== null) {
      const nilaiGas = Number(data.mq2);
      mq2El.textContent = nilaiGas;

      if (nilaiGas > 1500) {
        mq2StatusEl.textContent = 'Peringatan: Gas / Asap Terdeteksi!';
        mq2StatusEl.className = 'gas-status bahaya';
      } else {
        mq2StatusEl.textContent = 'Udara Normal / Aman';
        mq2StatusEl.className = 'gas-status aman';
      }
    }

    lastUpdateEl.textContent = new Date().toLocaleTimeString('id-ID');
  } catch (err) {
    console.error('Format JSON tidak valid:', err);
  }
});

client.on('reconnect', () => {
  statusBadge.textContent = 'Menghubungkan ulang...';
  statusBadge.className = 'badge connecting';
});

client.on('error', () => {
  statusBadge.textContent = 'Koneksi Error';
  statusBadge.className = 'badge error';
});