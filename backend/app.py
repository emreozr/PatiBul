import os
from flask import Flask, send_from_directory, request, jsonify
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from config import Config
from models import db
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
from datetime import datetime, timedelta
import secrets

mail = Mail()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
jwt = JWTManager()
bcrypt = Bcrypt()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    from routes.auth import auth_bp
    from routes.user import user_bp
    from routes.reports import reports_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(user_bp, url_prefix="/api/user")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    # Yüklenen fotoğrafları serve et
    @app.route("/uploads/<filename>")
    def uploaded_file(filename):
        upload_folder = os.path.join(app.root_path, "uploads")
        return send_from_directory(upload_folder, filename)

    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0")

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    
    if not data.get("email"):
        return jsonify({"error": "E-posta zorunludur"}), 400
    
    user = User.query.filter_by(email=data["email"]).first()
    
    if not user:
        # Güvenlik: hata vermek yerine başarılı mesajı dön
        return jsonify({"message": "E-posta gönderi başarılı"}), 200
    
    # Eski tokenları temizle
    PasswordResetToken.query.filter_by(user_id=user.id, used=False).delete()
    
    # Yeni token oluştur
    reset_token = secrets.token_urlsafe(32)
    expiry = datetime.utcnow() + timedelta(seconds=current_app.config['PASSWORD_RESET_TOKEN_EXPIRY'])
    
    token_record = PasswordResetToken(
        user_id=user.id,
        token=reset_token,
        expires_at=expiry
    )
    db.session.add(token_record)
    db.session.commit()
    
    # E-mail gönder
    reset_link = f"patibul://reset-password?token={reset_token}"
    msg = Message(
        subject="PatiBul - Şifre Sıfırlama",
        recipients=[user.email],
        body=f"""
Merhaba {user.name},

Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:
{reset_link}

Bu link 15 dakika geçerlidir.

Eğer bunu siz talep etmediyseniz, bu mesajı görmezden gelin.
        """
    )
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