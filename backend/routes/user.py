from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User
from math import radians, sin, cos, sqrt, atan2

user_bp = Blueprint("user", __name__)


def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1-a))


@user_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404

    return jsonify({"user": user.to_dict()}), 200


@user_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404

    data = request.get_json()
    user.name = data.get("name", user.name)
    user.phone = data.get("phone", user.phone)

    if user.role == "vet":
        user.clinic_name = data.get("clinic_name", user.clinic_name)
        user.clinic_address = data.get("clinic_address", user.clinic_address)
        user.clinic_hours = data.get("clinic_hours", user.clinic_hours)
        if "latitude" in data:
            user.latitude = data.get("latitude")
        if "longitude" in data:
            user.longitude = data.get("longitude")

    db.session.commit()

    return jsonify({"message": "Profil güncellendi", "user": user.to_dict()}), 200


@user_bp.route("/vets", methods=["GET"])
@jwt_required()
def get_vets():
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)
    radius = request.args.get("radius", default=10, type=float)
    vets = User.query.filter_by(role="vet").all()
    result = []
    for vet in vets:
        d = vet.to_dict()
        if lat is not None and lon is not None and vet.latitude and vet.longitude:
            distance = haversine_distance(lat, lon, vet.latitude, vet.longitude)
            if distance <= radius:
                d["distance_km"] = round(distance, 2)
                result.append(d)
        else:
            d["distance_km"] = None
            result.append(d)
    result.sort(key=lambda x: (x["distance_km"] is None, x["distance_km"] or 0))
    return jsonify({"vets": result}), 200
