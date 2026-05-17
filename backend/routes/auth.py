from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, PasswordResetToken
from app import bcrypt, mail
from config import Config
from datetime import datetime, timedelta
import secrets
import random
from flask_mail import Message

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
    try:
        data = request.get_json()
        if not data.get("email"):
            return jsonify({"error": "E-posta zorunludur"}), 400

        user = User.query.filter_by(email=data["email"]).first()

        # Kullanıcı bulunamasa bile aynı yanıtı dön (güvenlik)
        if not user:
            return jsonify({"message": "Kod gönderildi"}), 200

        # 6 haneli kod üret
        code = str(random.randint(100000, 999999))

        # Eski tokenları geçersiz kıl
        PasswordResetToken.query.filter_by(user_id=user.id, used=False).update({"used": True})
        db.session.commit()

        expires_at = datetime.utcnow() + timedelta(seconds=Config.PASSWORD_RESET_TOKEN_EXPIRY)
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=code,
            expires_at=expires_at
        )
        db.session.add(reset_token)
        db.session.commit()

        # Mail gönder
        msg = Message(
            subject="PatiBul - Şifre Sıfırlama Kodu",
            sender=Config.MAIL_DEFAULT_SENDER,
            recipients=[user.email]
        )
        msg.html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 30px; background: #f9f9f9; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #3DAA6E; font-size: 28px; margin: 0;">🐾 PatiBul</h1>
            </div>
            <h2 style="color: #333; font-size: 20px;">Şifre Sıfırlama</h2>
            <p style="color: #555; font-size: 15px;">Merhaba <strong>{user.name}</strong>,</p>
            <p style="color: #555; font-size: 15px;">Şifrenizi sıfırlamak için aşağıdaki 6 haneli kodu uygulamaya girin:</p>
            <div style="text-align: center; margin: 32px 0;">
                <span style="font-size: 42px; font-weight: bold; letter-spacing: 10px; color: #3DAA6E; background: #E8F5E9; padding: 16px 28px; border-radius: 12px;">{code}</span>
            </div>
            <p style="color: #888; font-size: 13px;">Bu kod <strong>15 dakika</strong> geçerlidir.</p>
            <p style="color: #888; font-size: 13px;">Eğer bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #bbb; font-size: 12px; text-align: center;">PatiBul — Kayıp Hayvan Takip Sistemi</p>
        </div>
        """
        mail.send(msg)

        return jsonify({"message": "Kod gönderildi"}), 200

    except Exception as e:
        print(f"MAIL_ERROR: {str(e)}")
        return jsonify({"error": "E-posta gönderilemedi"}), 500


@auth_bp.route("/verify-reset-token", methods=["POST"])
def verify_reset_token():
    data = request.get_json()
    code = data.get("token")
    email = data.get("email")

    if not code or not email:
        return jsonify({"error": "Kod ve e-posta zorunludur"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Geçersiz kod"}), 401

    token_record = PasswordResetToken.query.filter_by(
        token=code,
        user_id=user.id,
        used=False
    ).first()

    if not token_record or datetime.utcnow() > token_record.expires_at:
        return jsonify({"error": "Kod geçersiz veya süresi dolmuş"}), 401

    return jsonify({"message": "Kod geçerli", "user_id": user.id}), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    code = data.get("token")
    email = data.get("email")
    new_password = data.get("new_password")

    if not code or not email or not new_password:
        return jsonify({"error": "Eksik alanlar"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "Şifre en az 6 karakter olmalıdır"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Geçersiz işlem"}), 401

    token_record = PasswordResetToken.query.filter_by(
        token=code,
        user_id=user.id,
        used=False
    ).first()

    if not token_record or datetime.utcnow() > token_record.expires_at:
        return jsonify({"error": "Kod geçersiz veya süresi dolmuş"}), 401

    user.password = bcrypt.generate_password_hash(new_password).decode("utf-8")
    token_record.used = True
    db.session.commit()

    return jsonify({"message": "Şifre güncellendi"}), 200


@auth_bp.route("/change-password", methods=["PUT"])
@jwt_required()
def change_password():
    try:
        data = request.get_json()
        required = ["current_password", "new_password", "confirm_password"]
        if not data or not all(k in data for k in required):
            return jsonify({"error": "Eksik alanlar var"}), 400
        if data["new_password"] != data["confirm_password"]:
            return jsonify({"error": "Şifreler eşleşmiyor"}), 400
        user_id = get_jwt_identity()
        user = db.session.get(User, int(user_id))
        if not user or not bcrypt.check_password_hash(user.password, data["current_password"]):
            return jsonify({"error": "Mevcut şifre hatalı"}), 401
        user.password = bcrypt.generate_password_hash(data["new_password"]).decode("utf-8")
        db.session.commit()
        return jsonify({"message": "Şifre değiştirildi"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Sunucu hatası"}), 500