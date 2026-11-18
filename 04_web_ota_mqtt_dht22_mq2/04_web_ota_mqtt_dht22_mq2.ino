#include <WiFi.h>
#include <WebServer.h>
#include <Update.h>
#include <DHT.h>
#include <PubSubClient.h>

// 1. Pengaturan Wi-Fi
const char* ssid = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI_ANDA";

// 2. Pengaturan Broker & Topik MQTT
const char* mqtt_server = "broker.emqx.io";
const int mqtt_port = 1883;
const char* mqtt_topic = "testtopic/tugasiot";

// 3. Pengaturan Pin Sensor
#define DHTPIN 4
#define DHTTYPE DHT22
const int mq2Pin = 34;

DHT dht(DHTPIN, DHTTYPE);
WebServer server(80);
WiFiClient espClient;
PubSubClient mqtt(espClient);

float suhu = 0, kelembapan = 0;
int nilaiMQ2 = 0;

unsigned long previousMillis = 0;
const long interval = 2000;
unsigned long lastMqttReconnect = 0;

void reconnectMQTT() {
  if (millis() - lastMqttReconnect > 5000) {
    lastMqttReconnect = millis();
    String clientId = "ESP32-DHT22-" + String(random(0xffff), HEX);
    if (mqtt.connect(clientId.c_str())) {
      Serial.println("[OK] Terhubung ke Broker MQTT");
    } else {
      Serial.print("[ERR] Gagal koneksi MQTT, rc=");
      Serial.println(mqtt.state());
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(mq2Pin, INPUT);
  dht.begin();

  WiFi.begin(ssid, password);
  Serial.print("Menghubungkan ke Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nTerhubung!");
  Serial.print("IP Web OTA: http://");
  Serial.println(WiFi.localIP());

  mqtt.setServer(mqtt_server, mqtt_port);

  // Halaman Web OTA minimalis
  server.on("/", HTTP_GET, []() {
    server.send(200, "text/html",
      "<div style='font-family:sans-serif; max-width:400px; margin:50px auto;'>"
      "<h2>ESP32 Web OTA Update</h2>"
      "<form method='POST' action='/update' enctype='multipart/form-data'>"
      "<input type='file' name='update' accept='.bin' required><br><br>"
      "<input type='submit' value='Upload & Update' style='padding:8px 16px;'>"
      "</form></div>");
  });

  // Proses menerima & menulis file .bin
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

  if (!mqtt.connected()) {
    reconnectMQTT();
  } else {
    mqtt.loop();
  }

  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    float h = dht.readHumidity();
    float t = dht.readTemperature();
    nilaiMQ2 = analogRead(mq2Pin);

    bool dhtOk = !isnan(h) && !isnan(t);
    if (dhtOk) {
      suhu = t;
      kelembapan = h;
    } else {
      Serial.println("[ERR] Gagal membaca sensor DHT22!");
    }

    String payload = "{";
    payload += "\"suhu\":" + (dhtOk ? String(suhu, 1) : "null") + ",";
    payload += "\"kelembapan\":" + (dhtOk ? String(kelembapan, 1) : "null") + ",";
    payload += "\"mq2\":" + String(nilaiMQ2);
    payload += "}";

    if (mqtt.connected()) {
      mqtt.publish(mqtt_topic, payload.c_str());
      Serial.println("MQTT Sent -> " + payload);
    } else {
      Serial.println("Offline -> " + payload);
    }
  }
}