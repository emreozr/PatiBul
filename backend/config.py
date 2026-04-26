import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "patibul_cok_gizli_ve_uzun_anahtar_1234567890_asdfghjkl")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY","patibul-jwt-icin-daha-da-uzun-bir-anahtar-987654321")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///patibul.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'

    # PatiBul Mail Adresin ve Uygulama Şifren:
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', 'noreplypatibul@gmail.com')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', 'tywtzlivulncejyq')

    # Kullanıcılara giden mailde görünecek isim ve adres:
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', ('PatiBul Destek', 'noreplypatibul@gmail.com'))
    
    # Token expiry time (15 dakika)
    PASSWORD_RESET_TOKEN_EXPIRY = 900  # saniye