from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from flask_bcrypt import Bcrypt
from models import db, User

auth_bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()

@auth_bp.route("/register", methods=["POST"])
def register():
    from app import bcrypt
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
        phone=data.get("phone")
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Kayıt başarılı", "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    from app import bcrypt
    data = request.get_json()

    if not data.get("email") or not data.get("password"):
        return jsonify({"error": "E-posta ve şifre zorunludur"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not bcrypt.check_password_hash(user.password, data["password"]):
        return jsonify({"error": "E-posta veya şifre hatalı"}), 401

    token = create_access_token(identity={"id": user.id, "role": user.role})

    return jsonify({
        "message": "Giriş başarılı",
        "access_token": token,
        "user": user.to_dict()
    }), 200
