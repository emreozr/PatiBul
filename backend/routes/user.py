from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User

user_bp = Blueprint("user", __name__)

@user_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    identity = get_jwt_identity()
    user = User.query.get(identity["id"])

    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404

    return jsonify({"user": user.to_dict()}), 200


@user_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    identity = get_jwt_identity()
    user = User.query.get(identity["id"])

    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404

    data = request.get_json()
    user.name = data.get("name", user.name)
    user.phone = data.get("phone", user.phone)

    if user.role == "vet":
        user.clinic_name = data.get("clinic_name", user.clinic_name)
        user.clinic_address = data.get("clinic_address", user.clinic_address)
        user.clinic_hours = data.get("clinic_hours", user.clinic_hours)

    db.session.commit()

    return jsonify({"message": "Profil güncellendi", "user": user.to_dict()}), 200
