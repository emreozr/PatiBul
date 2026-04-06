from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, PetReport, VetResponse

reports_bp = Blueprint("reports", __name__)


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


# ─── Tüm bildirimleri listele ──────────────────────────────────────────────
@reports_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_reports():
    report_type = request.args.get("type")
    status = request.args.get("status")

    query = PetReport.query

    if report_type:
        query = query.filter_by(report_type=report_type)
    if status:
        query = query.filter_by(status=status)

    reports = query.order_by(PetReport.created_at.desc()).all()
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