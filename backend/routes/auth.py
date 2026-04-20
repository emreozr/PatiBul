from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from models import db, User, PasswordResetToken
from app import bcrypt, mail
from config import Config
from datetime import datetime, timedelta
import secrets

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    for field in ["name", "email", "password"]:
        if not data.get(field):
            return jsonify({"error": f"{field} zorunludur"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Bu e-posta zaten kayıtlı"}), 409

    role = data.get("role", "user")
    if role not in ["user", "vet"]:
        return jsonify({"error": "Geçersiz rol"}), 400

    hashed_pw = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    user = User(
        name=data["name"],
        email=data["email"],
        password=hashed_pw,
        role=role,
        phone=data.get("phone"),
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Kayıt başarılı", "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data.get("email") or not data.get("password"):
        return jsonify({"error": "E-posta ve şifre zorunludur"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not bcrypt.check_password_hash(user.password, data["password"]):
        return jsonify({"error": "E-posta veya şifre hatalı"}), 401

    # identity string olmalı, rol additional_claims ile gönderiliyor
    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )

    return jsonify({
        "message": "Giriş başarılı",
        "access_token": token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    
    if not data.get("email"):
        return jsonify({"error": "E-posta zorunludur"}), 400
    
    user = User.query.filter_by(email=data["email"]).first()
    
    if not user:
        # Güvenlik: hata vermek yerine başarılı mesajı dön
        return jsonify({"message": "E-posta gönderi başarılı"}), 200
    
    # Token oluştur
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(seconds=Config.PASSWORD_RESET_TOKEN_EXPIRY)
    
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    db.session.add(reset_token)
    db.session.commit()
    
    # E-posta gönder
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    msg = Message(
        "Şifre Sıfırlama",
        sender=Config.MAIL_DEFAULT_SENDER,
        recipients=[user.email]
    )
    msg.body = f"""
Merhaba {user.name},

Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:
{reset_link}

Bu link 15 dakika geçerlidir.

Eğer bunu siz talep etmediyseniz, bu mesajı görmezden gelin.
    """
    mail.send(msg)
    
    return jsonify({"message": "Şifre sıfırlama e-postası gönderildi"}), 200


@auth_bp.route("/verify-reset-token", methods=["POST"])
def verify_reset_token():
    """Token doğrulaması yap"""
    data = request.get_json()
    token = data.get("token")
    
    if not token:
        return jsonify({"error": "Token gerekli"}), 400
    
    token_record = PasswordResetToken.query.filter_by(token=token).first()
    
    if not token_record:
        return jsonify({"error": "Geçersiz token"}), 401
    
    if token_record.used:
        return jsonify({"error": "Bu token zaten kullanılmıştır"}), 401
    
    if datetime.utcnow() > token_record.expires_at:
        return jsonify({"error": "Token süresi dolmuştur"}), 401
    
    return jsonify({
        "message": "Token geçerli",
        "user_id": token_record.user_id
    }), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """Yeni şifre belirle"""
    data = request.get_json()
    token = data.get("token")
    new_password = data.get("new_password")
    
    if not token or not new_password:
        return jsonify({"error": "Token ve yeni şifre gerekli"}), 400
    
    if len(new_password) < 6:
        return jsonify({"error": "Şifre en az 6 karakter olmalı"}), 400
    
    token_record = PasswordResetToken.query.filter_by(token=token).first()
    
    if not token_record:
        return jsonify({"error": "Geçersiz token"}), 401
    
    if token_record.used:
        return jsonify({"error": "Bu token zaten kullanılmıştır"}), 401
    
    if datetime.utcnow() > token_record.expires_at:
        return jsonify({"error": "Token süresi dolmuştur"}), 401
    
    # Şifreyi güncelle
    user = token_record.user
    user.password = bcrypt.generate_password_hash(new_password).decode("utf-8")
    token_record.used = True
    
    db.session.commit()
    
    return jsonify({"message": "Şifreniz başarıyla sıfırlandı"}), 200