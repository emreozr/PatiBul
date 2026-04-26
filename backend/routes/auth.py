from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, PasswordResetToken
from app import bcrypt, mail
from config import Config
from datetime import datetime, timedelta
import secrets
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
        if not user:
            return jsonify({"message": "E-posta gönderimi başarılı"}), 200
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(seconds=Config.PASSWORD_RESET_TOKEN_EXPIRY)
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at
        )
        db.session.add(reset_token)
        db.session.commit()
        # Frontend URL'nize göre burayı güncelleyebilirsiniz
        reset_link = f"http://localhost:3000/reset-password?token={token}"
        msg = Message(
            "PatiBul - Şifre Sıfırlama",
            sender=Config.MAIL_DEFAULT_SENDER,
            recipients=[user.email]
        )
        msg.body = f"Merhaba {user.name},\n\nŞifrenizi sıfırlamak için şu linke tıklayın: {reset_link}"
        mail.send(msg)
        return jsonify({"message": "Şifre sıfırlama e-postası gönderildi"}), 200
    except Exception as e:
        print(f"MAIL_ERROR: {str(e)}")
        return jsonify({"error": "E-posta gönderilemedi"}), 500

@auth_bp.route("/verify-reset-token", methods=["POST"])
def verify_reset_token():
    data = request.get_json()
    token = data.get("token")
    token_record = PasswordResetToken.query.filter_by(token=token).first()
    if not token_record or token_record.used or datetime.utcnow() > token_record.expires_at:
        return jsonify({"error": "Geçersiz veya süresi dolmuş token"}), 401
    return jsonify({"message": "Token geçerli", "user_id": token_record.user_id}), 200

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    token = data.get("token")
    new_password = data.get("new_password")
    token_record = PasswordResetToken.query.filter_by(token=token).first()
    if not token_record or token_record.used or datetime.utcnow() > token_record.expires_at:
        return jsonify({"error": "İşlem geçersiz"}), 401
    user = db.session.get(User, token_record.user_id)
    if user:
        user.password = bcrypt.generate_password_hash(new_password).decode("utf-8")
        token_record.used = True
        db.session.commit()
        return jsonify({"message": "Şifre güncellendi"}), 200
    return jsonify({"error": "Kullanıcı bulunamadı"}), 404

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