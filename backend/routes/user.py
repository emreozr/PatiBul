import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import db, User
from math import radians, sin, cos, sqrt, atan2

user_bp = Blueprint("user", __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1-a))

@user_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    try:
        user_id = int(get_jwt_identity())
        user = db.session.get(User, user_id)

        if not user:
            return jsonify({"error": "Kullanıcı bulunamadı"}), 404

        return jsonify({"user": user.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    try:
        user_id = int(get_jwt_identity())
        user = db.session.get(User, user_id)

        if not user:
            return jsonify({"error": "Kullanıcı bulunamadı"}), 404

        data = request.get_json()
        user.name = data.get("name", user.name)
        user.phone = data.get("phone", user.phone)
        user.profile_photo = data.get("profile_photo", user.profile_photo)

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
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

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

@user_bp.route("/profile/photo", methods=["POST"])
@jwt_required()
def upload_profile_photo():
    try:
        user_id = int(get_jwt_identity())
        user = db.session.get(User, user_id)

        if not user:
            return jsonify({"error": "Kullanıcı bulunamadı"}), 404

        # 400 hatasını önlemek için 'photo' anahtarı kontrolü
        if 'photo' not in request.files:
            return jsonify({"error": "Fotoğraf dosyası bulunamadı"}), 400

        file = request.files['photo']
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({"error": "Geçersiz dosya formatı"}), 400

        # Dosya adını güvenli hale getir
        filename = secure_filename(f"user_{user_id}_{file.filename}")

        # Klasör yolunu ayarla ve yoksa oluştur
        upload_folder = os.path.join(current_app.root_path, 'uploads', 'profiles')
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)

        # Eski fotoğrafı sistemden sil (isteğe bağlı, temizlik için iyi olur)
        if user.profile_photo:
            old_path = os.path.join(current_app.root_path, user.profile_photo)
            if os.path.exists(old_path) and os.path.isfile(old_path):
                try:
                    os.remove(old_path)
                except Exception as e:
                    print(f"Eski dosya silinemedi: {e}")

        # Veritabanına yeni yolu kaydet
        user.profile_photo = f"uploads/profiles/{filename}"
        db.session.commit()

        return jsonify({
            "message": "Fotoğraf yüklendi",
            "photo_url": user.profile_photo
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Upload hatası: {e}")
        return jsonify({"error": "Sunucu hatası oluştu"}), 500