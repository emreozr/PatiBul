import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "patibul-secret-key")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "patibul-jwt-secret")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///patibul.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
