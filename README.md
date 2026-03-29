🐾 PatiBul – Kayıp Hayvan Takip ve Bildirim Sistemi

Kayıp, yaralı ve bulunan hayvanlar için merkezi mobil platform.
Hayvan sahipleri, gönüllüler ve veteriner klinikleri arasında hızlı koordinasyon sağlar.


📋 İçindekiler

Proje Hakkında
Özellikler
Teknolojiler
Kurulum
Proje Yapısı
Ekip


🔍 Proje Hakkında
PatiBul, kayıp hayvanların bulunmasını kolaylaştırmak amacıyla geliştirilmiş bir mobil uygulamadır. Mevcut durumda kayıp hayvan bildirimleri sosyal medya ve mahalle gruplarında dağınık şekilde paylaşılmaktadır. PatiBul bu süreci tek bir platformda toplar.
Hedef Kitle: Hayvan sahipleri, hayvan bulan kişiler, veteriner klinikleri

✨ Özellikler
Kullanıcı kayıt ve giriş✅ Sprint 1
JWT tabanlı kimlik doğrulama✅ Sprint 1
Kullanıcı / Veteriner rol ayrımı✅ Sprint 1
Profil görüntüleme ve güncelleme✅ Sprint 1
Kayıp / yaralı / bulunan bildirim🔄 Sprint 2
Fotoğraf ekleme🔄 Sprint 2
Konum ve harita entegrasyonu🔄 Sprint 2
Veteriner klinik listeleme🔄 Sprint 3
Bildirimi veterinere iletme🔄 Sprint 3
Veteriner yanıt sistemi🔄 Sprint 4

🛠 Teknolojiler
Frontend

React Native (Expo)
React Navigation
AsyncStorage

Backend

Python Flask
Flask-JWT-Extended
Flask-Bcrypt
SQLAlchemy

Veritabanı

SQLite (geliştirme)

DevOps

GitHub Actions (CI)
Git – Branch stratejisi


🚀 Kurulum
Gereksinimler

Python 3.11+
Node.js 18+
Expo Go (mobil cihaz)

Backend
bashcd backend
pip install -r requirements.txt
python app.py
Backend http://localhost:5000 adresinde çalışır.
Frontend
bashcd frontend/PatiBulApp
npm install
npx expo start
Expo Go uygulamasıyla QR kodu tara.

Not: Gerçek cihazda test için BASE_URL'i bilgisayarının WiFi IP adresiyle güncelle.
Örnek: http://192.168.1.5:5000


📁 Proje Yapısı
patibul/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI
├── backend/
│   ├── app.py                  # Flask uygulaması
│   ├── config.py               # Konfigürasyon
│   ├── models.py               # Veritabanı modelleri
│   ├── requirements.txt        # Python bağımlılıkları
│   ├── routes/
│   │   ├── auth.py             # Kayıt / Giriş
│   │   └── user.py             # Profil
│   └── tests/
│       ├── conftest.py         # Test konfigürasyonu
│       └── test_auth.py        # API testleri
├── frontend/
│   └── PatiBulApp/
│       ├── App.js              # Ana uygulama
│       └── src/
│           ├── screens/        # Ekranlar
│           └── styles/         # Stil dosyaları
└── README.md

🔄 CI/CD
Her main branch push'unda GitHub Actions otomatik olarak çalışır:

Python bağımlılıklarını yükler
API testlerini çalıştırır (pytest)

📄 Lisans
Bu proje İstanbul Arel Üniversitesi Yazılım Gereksinim Analizi & Çevik Yazılım Yaklaşımları dersi kapsamında geliştirilmektedir.
