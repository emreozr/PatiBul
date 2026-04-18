import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "patibul-secret-key")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "patibul-jwt-secret")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///patibul.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', True)
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', 'your-email@gmail.com')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', 'your-app-password')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@patibul.com')
    
    # Token expiry time (15 dakika)
    PASSWORD_RESET_TOKEN_EXPIRY = 900  # saniye