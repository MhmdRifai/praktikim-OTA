#include <WiFi.h>
#include <WebServer.h>
#include <Update.h>
#include <DHT.h>

const char* ssid = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI_ANDA";

#define DHTPIN 4
#define DHTTYPE DHT22
const int mq2Pin = 34;

DHT dht(DHTPIN, DHTTYPE);
WebServer server(80);

float suhu = 0, kelembapan = 0;
int nilaiMQ2 = 0;
bool dhtOk = false;

unsigned long previousMillis = 0;
const long interval = 2000;

String getSensorText() {
  String data = "<h3>Data Sensor ESP32</h3>";
  data += dhtOk ? "Suhu (DHT22): " + String(suhu, 1) + " °C<br>" : "Suhu (DHT22): Gagal membaca sensor<br>";
  data += dhtOk ? "Kelembapan (DHT22): " + String(kelembapan, 1) + " %<br>" : "";
  data += "Gas / Asap (MQ-2): " + String(nilaiMQ2) + " / 4095 (" + String(map(nilaiMQ2, 0, 4095, 0, 100)) + "%)<br>";
  return data;
}

void setup() {
  Serial.begin(115200);
  pinMode(mq2Pin, INPUT);
  dht.begin();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.print("\nTerhubung! IP: ");
  Serial.println(WiFi.localIP());

  server.on("/", HTTP_GET, []() {
    String html = "<div id='sensor'>" + getSensorText() + "</div><hr>";
    html += "<form method='POST' action='/update' enctype='multipart/form-data'>"
            "<input type='file' name='update' accept='.bin' required> "
            "<input type='submit' value='Update Firmware'>"
            "</form>"
            "<script>setInterval(()=>fetch('/data').then(r=>r.text()).then(t=>document.getElementById('sensor').innerHTML=t),2000);</script>";
    server.send(200, "text/html", html);
  });

  server.on("/data", HTTP_GET, []() {
    server.send(200, "text/html", getSensorText());
  });

  server.on("/update", HTTP_POST, []() {
    server.sendHeader("Connection", "close");
    server.send(200, "text/plain", Update.hasError() ? "Update Gagal!" : "Update Berhasil! Restarting...");
    delay(1000);
    ESP.restart();
  }, []() {
    HTTPUpload& upload = server.upload();
    if (upload.status == UPLOAD_FILE_START) {
      Update.begin(UPDATE_SIZE_UNKNOWN);
    } else if (upload.status == UPLOAD_FILE_WRITE) {
      Update.write(upload.buf, upload.currentSize);
    } else if (upload.status == UPLOAD_FILE_END) {
      Update.end(true);
    }
  });

  server.begin();
}

void loop() {
  server.handleClient();

  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    float h = dht.readHumidity();
    float t = dht.readTemperature();
    nilaiMQ2 = analogRead(mq2Pin);

    dhtOk = !isnan(h) && !isnan(t);
    if (dhtOk) {
      suhu = t;
      kelembapan = h;
      Serial.printf("Suhu: %.1f C | Lembap: %.1f %% | MQ-2: %d\n", suhu, kelembapan, nilaiMQ2);
    } else {
      Serial.printf("[ERR] DHT22 gagal terbaca! | MQ-2: %d\n", nilaiMQ2);
    }
  }
}