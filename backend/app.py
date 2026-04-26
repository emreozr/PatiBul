import os
from flask import Flask, send_from_directory
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from config import Config
from models import db
from flask_mail import Mail
# Message ve diğerlerini burada kullanmıyorsan silebilirsin, kalabalık yapmasın

# Objeleri globalde tanımlıyoruz
mail = Mail()
bcrypt = Bcrypt()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Veritabanı ve eklentileri başlat
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app) # Mail burada app'e bağlanıyor

    # Blueprint'leri kayıt et
    from routes.auth import auth_bp
    from routes.user import user_bp
    from routes.reports import reports_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(user_bp, url_prefix="/api/user")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    @app.route("/uploads/<filename>")
    def uploaded_file(filename):
        upload_folder = os.path.join(app.root_path, "uploads")
        return send_from_directory(upload_folder, filename)

    with app.app_context():
        db.create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    # Debug modu açık kalsın ki hatayı terminalde görelim
    app.run(debug=True, host="0.0.0.0", port=5000)