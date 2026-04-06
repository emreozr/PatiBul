import os
import uuid
from math import radians, sin, cos, sqrt, atan2

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from werkzeug.utils import secure_filename

from models import db, PetReport, VetResponse, ReportImage

reports_bp = Blueprint("reports", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def haversine_distance(lat1, lon1, lat2, lon2):
    """İki koordinat arasındaki mesafeyi km cinsinden hesaplar."""
    R = 6371  # Dünya yarıçapı km
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


# ─── Kullanıcı: Bildirim oluştur ───────────────────────────────────────────
@reports_bp.route("/", methods=["POST"])
@jwt_required()
def create_report():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    if role != "user":
        return jsonify({"error": "Sadece kullanıcılar bildirim oluşturabilir"}), 403

    data = request.get_json()

    for field in ["report_type", "animal_type", "description"]:
        if not data.get(field):
            return jsonify({"error": f"{field} zorunludur"}), 400

    if data["report_type"] not in ["kayip", "bulunan", "yarali"]:
        return jsonify({"error": "Geçersiz bildirim türü"}), 400

    report = PetReport(
        user_id=int(user_id),
        report_type=data["report_type"],
        animal_type=data["animal_type"],
        description=data["description"],
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        location_desc=data.get("location_desc"),
    )

    db.session.add(report)
    db.session.commit()

    return jsonify({"message": "Bildirim oluşturuldu", "report": report.to_dict()}), 201


# ─── Fotoğraf yükle ────────────────────────────────────────────────────────
@reports_bp.route("/<int:report_id>/upload-image", methods=["POST"])
@jwt_required()
def upload_image(report_id):
    user_id = get_jwt_identity()
    report = PetReport.query.get_or_404(report_id)

    if report.user_id != int(user_id):
        return jsonify({"error": "Bu bildirime fotoğraf ekleyemezsiniz"}), 403

    if "image" not in request.files:
        return jsonify({"error": "Fotoğraf seçilmedi"}), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({"error": "Dosya adı boş"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Geçersiz dosya türü"}), 400

    upload_folder = os.path.join(current_app.root_path, "uploads")
    os.makedirs(upload_folder, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    image_url = f"/uploads/{filename}"

    image = ReportImage(
        report_id=report_id,
        image_url=image_url,
    )
    db.session.add(image)
    db.session.commit()

    return jsonify({"message": "Fotoğraf yüklendi", "image": image.to_dict()}), 201


# ─── Tüm bildirimleri listele (konum bazlı filtreleme) ────────────────────
@reports_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_reports():
    report_type = request.args.get("type")
    status = request.args.get("status")
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)
    radius = request.args.get("radius", default=10, type=float)  # varsayılan 10 km

    query = PetReport.query

    if report_type:
        query = query.filter_by(report_type=report_type)
    if status:
        query = query.filter_by(status=status)

    reports = query.order_by(PetReport.created_at.desc()).all()

    # Konum filtresi
    if lat is not None and lon is not None:
        filtered = []
        for r in reports:
            if r.latitude is not None and r.longitude is not None:
                distance = haversine_distance(lat, lon, r.latitude, r.longitude)
                if distance <= radius:
                    r_dict = r.to_dict()
                    r_dict["distance_km"] = round(distance, 2)
                    filtered.append(r_dict)
            # Konumu olmayanları da göster
            else:
                r_dict = r.to_dict()
                r_dict["distance_km"] = None
                filtered.append(r_dict)

        filtered.sort(key=lambda x: (x["distance_km"] is None, x["distance_km"] or 0))
        return jsonify({"reports": filtered}), 200

    return jsonify({"reports": [r.to_dict() for r in reports]}), 200


# ─── Kullanıcı: Kendi bildirimlerini listele ───────────────────────────────
@reports_bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_reports():
    user_id = get_jwt_identity()
    reports = (
        PetReport.query
        .filter_by(user_id=int(user_id))
        .order_by(PetReport.created_at.desc())
        .all()
    )
    return jsonify({"reports": [r.to_dict() for r in reports]}), 200


# ─── Bildirim detayı ───────────────────────────────────────────────────────
@reports_bp.route("/<int:report_id>", methods=["GET"])
@jwt_required()
def get_report(report_id):
    report = PetReport.query.get_or_404(report_id)
    return jsonify({"report": report.to_dict()}), 200


# ─── Veteriner: Bildirim durumunu güncelle ────────────────────────────────
@reports_bp.route("/<int:report_id>/status", methods=["PUT"])
@jwt_required()
def update_status(report_id):
    claims = get_jwt()
    role = claims.get("role")

    if role != "vet":
        return jsonify({"error": "Sadece veterinerler durum güncelleyebilir"}), 403

    report = PetReport.query.get_or_404(report_id)
    data = request.get_json()
    status = data.get("status")

    if status not in ["beklemede", "inceleniyor", "tamamlandi"]:
        return jsonify({"error": "Geçersiz durum"}), 400

    report.status = status
    db.session.commit()

    return jsonify({"message": "Durum güncellendi", "report": report.to_dict()}), 200


# ─── Veteriner: Bildirime yanıt ver ───────────────────────────────────────
@reports_bp.route("/<int:report_id>/respond", methods=["POST"])
@jwt_required()
def respond_to_report(report_id):
    vet_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    if role != "vet":
        return jsonify({"error": "Sadece veterinerler yanıt verebilir"}), 403

    report = PetReport.query.get_or_404(report_id)
    data = request.get_json()

    if not data.get("message"):
        return jsonify({"error": "Mesaj zorunludur"}), 400

    response = VetResponse(
        report_id=report_id,
        vet_id=int(vet_id),
        message=data["message"],
    )

    if report.status == "beklemede":
        report.status = "inceleniyor"

    db.session.add(response)
    db.session.commit()

    return jsonify({"message": "Yanıt gönderildi", "response": response.to_dict()}), 201


# ─── Bildirimin yanıtlarını getir ─────────────────────────────────────────
@reports_bp.route("/<int:report_id>/responses", methods=["GET"])
@jwt_required()
def get_responses(report_id):
    PetReport.query.get_or_404(report_id)
    responses = (
        VetResponse.query
        .filter_by(report_id=report_id)
        .order_by(VetResponse.created_at.desc())
        .all()
    )
    return jsonify({"responses": [r.to_dict() for r in responses]}), 200