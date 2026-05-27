import requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User
from math import radians, sin, cos, sqrt, atan2

notifications_bp = Blueprint("notifications", __name__)


def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


def send_push_notifications(tokens, title, body, data=None):
    """Expo push notification gönder"""
    if not tokens:
        return

    messages = []
    for token in tokens:
        if not token or not token.startswith("ExponentPushToken"):
            continue
        msg = {
            "to": token,
            "title": title,
            "body": body,
            "sound": "default",
            "priority": "high",
        }
        if data:
            msg["data"] = data
        messages.append(msg)

    if not messages:
        return

    try:
        response = requests.post(
            "https://exp.host/--/api/v2/push/send",
            json=messages,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            timeout=10,
        )
        print(f"Push notification yanıtı: {response.status_code}")
    except Exception as e:
        print(f"Push notification hatası: {str(e)}")


def notify_nearby_users(report_lat, report_lon, title, body, exclude_user_id=None, radius_km=10):
    """Yakındaki kullanıcılara bildirim gönder"""
    users = User.query.filter(
        User.role == "user",
        User.push_token != None,
        User.latitude != None,
        User.longitude != None,
    ).all()

    nearby_tokens = []
    for user in users:
        if exclude_user_id and user.id == exclude_user_id:
            continue
        distance = haversine_distance(report_lat, report_lon, user.latitude, user.longitude)
        if distance <= radius_km:
            nearby_tokens.append(user.push_token)

    send_push_notifications(nearby_tokens, title, body)
    print(f"{len(nearby_tokens)} kullanıcıya bildirim gönderildi")


# ─── Push token kaydet ────────────────────────────────────────────────────
@notifications_bp.route("/register-token", methods=["POST"])
@jwt_required()
def register_token():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    token = data.get("token")

    if not token:
        return jsonify({"error": "Token zorunludur"}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404

    user.push_token = token
    db.session.commit()

    return jsonify({"message": "Token kaydedildi"}), 200


# ─── Push token sil (çıkış yapınca) ──────────────────────────────────────
@notifications_bp.route("/unregister-token", methods=["POST"])
@jwt_required()
def unregister_token():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if user:
        user.push_token = None
        db.session.commit()
    return jsonify({"message": "Token silindi"}), 200


# ─── Konum güncelle ───────────────────────────────────────────────────────
@notifications_bp.route("/update-location", methods=["POST"])
@jwt_required()
def update_location():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    lat = data.get("latitude")
    lon = data.get("longitude")

    if lat is None or lon is None:
        return jsonify({"error": "Konum zorunludur"}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404

    user.latitude = lat
    user.longitude = lon
    db.session.commit()

    return jsonify({"message": "Konum güncellendi"}), 200