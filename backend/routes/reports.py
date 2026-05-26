import os
import uuid
import base64
import requests
from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from models import db, PetReport, VetResponse, ReportImage, User
from config import Config

reports_bp = Blueprint("reports", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


def verify_animal_in_photo(image_path, expected_animal_type, description=""):
    """
    OpenAI GPT-4o ile fotoğrafta hayvan olup olmadığını ve
    açıklamayla uyuşup uyuşmadığını kontrol eder.
    Döner: (is_valid: bool, message: str)
    """
    try:
        with open(image_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode("utf-8")

        ext = image_path.rsplit(".", 1)[-1].lower()
        mime_type = "image/png" if ext == "png" else "image/jpeg"

        description_part = f"\nİlan açıklaması: {description}" if description else ""

        prompt = f"""Bu fotoğrafı analiz et.

İlanda belirtilen hayvan türü: {expected_animal_type}{description_part}

Lütfen sadece şu formatta yanıt ver:
HAYVAN_VAR: evet/hayır
HAYVAN_TURU: (fotoğraftaki hayvan türü, yoksa "yok")
ESLESIYOR: evet/hayır/belirsiz
ACIKLAMA: (kısa bir açıklama, max 1 cümle)

Kontrol kuralları:
1. HAYVAN TÜRÜ (kesin kontrol):
   - Fotoğraftaki hayvan türü ilan türüyle tam eşleşmeli
   - Kedi ilanına köpek, köpek ilanına kedi kesinlikle reddedilir
   - Tür eşleşmiyorsa ESLESIYOR: hayır yaz

2. AÇIKLAMA DETAYLARI (yalnızca apaçık çelişkide reddet):
   - Sadece renk tamamen zıt ve kesin farklıysa reddet
     Örnek: "siyah kedi" yazıyor ama fotoğrafta turuncu/sarı kedi → reddet
     Örnek: "beyaz köpek" yazıyor ama fotoğrafta kahverengi köpek → reddet
     Örnek: "turuncu kedi" yazıyor ama fotoğrafta siyah kedi → reddet
   - Renk biraz farklıysa veya belirsizse reddetme (ışık, filtre etkisi olabilir)
     Örnek: "sarı kedi" yazıyor, fotoğrafta krem/bej kedi → kabul et
   - Tasma, aksesuar, ırk gibi detaylar görünmüyorsa kesinlikle reddetme
   - Şüphe durumunda daima ESLESIYOR: belirsiz yaz → kabul edilir

3. GENEL:
   - Fotoğrafta hiç hayvan yoksa HAYVAN_VAR: hayır yaz
   - İnsan, manzara, yemek, nesne fotoğrafları kesinlikle reddedilmeli"""

        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {Config.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o",
                "max_tokens": 200,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{image_data}",
                                    "detail": "low",
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
            },
            timeout=15,
        )

        if response.status_code != 200:
            print(f"OpenAI API hatası: {response.status_code} - {response.text}")
            return True, "Doğrulama yapılamadı, fotoğraf kabul edildi"

        content = response.json()["choices"][0]["message"]["content"]
        print(f"OpenAI yanıtı: {content}")

        lines = content.strip().split("\n")
        result = {}
        for line in lines:
            if ":" in line:
                key, val = line.split(":", 1)
                result[key.strip()] = val.strip().lower()

        hayvan_var = result.get("HAYVAN_VAR", "hayır")
        eslesiyor = result.get("ESLESIYOR", "hayır")

        if hayvan_var == "hayır":
            return False, "Fotoğrafta hayvan tespit edilemedi. Lütfen hayvanın göründüğü bir fotoğraf yükleyin."

        if eslesiyor == "hayır":
            hayvan_turu = result.get("HAYVAN_TURU", "").strip()
            if hayvan_turu and hayvan_turu == expected_animal_type.lower():
                return False, "Fotoğraftaki hayvanın özellikleri (renk, görünüm) açıklamanızla uyuşmuyor. Lütfen açıklamanıza uygun bir fotoğraf yükleyin."
            return False, f"Fotoğraftaki hayvan türü ilan türüyle uyuşmuyor. Lütfen '{expected_animal_type}' fotoğrafı yükleyin."

        return True, "Fotoğraf doğrulandı"

    except requests.Timeout:
        print("OpenAI API timeout")
        return True, "Doğrulama zaman aşımına uğradı, fotoğraf kabul edildi"
    except Exception as e:
        print(f"Fotoğraf doğrulama hatası: {str(e)}")
        return True, "Doğrulama yapılamadı, fotoğraf kabul edildi"


# ─── Bildirim oluştur ──────────────────────────────────────────────────────
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


# ─── Tüm bildirimleri listele ──────────────────────────────────────────────
@reports_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_reports():
    report_type = request.args.get("type")
    status = request.args.get("status")
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)
    radius = request.args.get("radius", default=10, type=float)
    query = PetReport.query
    if report_type:
        query = query.filter_by(report_type=report_type)
    if status:
        query = query.filter_by(status=status)
    reports = query.order_by(PetReport.created_at.desc()).all()
    if lat is not None and lon is not None:
        filtered = []
        for r in reports:
            if r.latitude is not None and r.longitude is not None:
                distance = haversine_distance(lat, lon, r.latitude, r.longitude)
                if distance <= radius:
                    r_dict = r.to_dict()
                    r_dict["distance_km"] = round(distance, 2)
                    filtered.append(r_dict)
            else:
                r_dict = r.to_dict()
                r_dict["distance_km"] = None
                filtered.append(r_dict)
        filtered.sort(key=lambda x: (x["distance_km"] is None, x["distance_km"] or 0))
        return jsonify({"reports": filtered}), 200
    return jsonify({"reports": [r.to_dict() for r in reports]}), 200


# ─── Kendi bildirimlerini listele ──────────────────────────────────────────
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


# ─── Kapatılan ilanlar (bulunan hayvanlar) ─────────────────────────────────
# ÖNEMLI: Bu route /<int:report_id> rotalarından ÖNCE olmalı
@reports_bp.route("/closed", methods=["GET"])
@jwt_required()
def get_closed_reports():
    reports = (
        PetReport.query
        .filter_by(status="tamamlandi", report_type="bulunan")
        .order_by(PetReport.created_at.desc())
        .all()
    )
    return jsonify({"reports": [r.to_dict() for r in reports]}), 200


# ─── Yeni ilan sayısı ─────────────────────────────────────────────────────
# ÖNEMLI: Bu route /<int:report_id> rotalarından ÖNCE olmalı
@reports_bp.route("/new-count", methods=["GET"])
@jwt_required()
def get_new_reports_count():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"new_count": 0}), 200
    if user.last_seen_reports:
        cutoff = user.last_seen_reports
    else:
        cutoff = datetime.utcnow() - timedelta(hours=24)
    count = PetReport.query.filter(PetReport.created_at > cutoff).count()
    return jsonify({"new_count": count}), 200


# ─── İlanları görüldü olarak işaretle ────────────────────────────────────
# ÖNEMLI: Bu route /<int:report_id> rotalarından ÖNCE olmalı
@reports_bp.route("/mark-seen", methods=["POST"])
@jwt_required()
def mark_reports_seen():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404
    user.last_seen_reports = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "Görüldü"}), 200


# ─── Fotoğraf doğrula (ilan oluşturmadan önce) ────────────────────────────
# ÖNEMLI: Bu route /<int:report_id> rotalarından ÖNCE olmalı
@reports_bp.route("/verify-photo", methods=["POST"])
@jwt_required()
def verify_photo():
    animal_type = request.form.get("animal_type", "")
    if not animal_type:
        return jsonify({"error": "Hayvan türü zorunludur"}), 400
    if "image" not in request.files:
        return jsonify({"error": "Fotoğraf seçilmedi"}), 400
    file = request.files["image"]
    if not allowed_file(file.filename):
        return jsonify({"error": "Geçersiz dosya türü"}), 400

    # Geçici dosyaya kaydet
    upload_folder = os.path.join(current_app.root_path, "uploads", "temp")
    os.makedirs(upload_folder, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"temp_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    # Açıklamayı da al
    description = request.form.get("description", "")

    # Doğrula
    is_valid, message = verify_animal_in_photo(filepath, animal_type, description)

    # Geçici dosyayı sil
    try:
        os.remove(filepath)
    except:
        pass

    if not is_valid:
        return jsonify({"error": message}), 400

    return jsonify({"message": message, "valid": True}), 200


# ─── Fotoğraf yükle (OpenAI doğrulama ile) ────────────────────────────────
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

    # Önce geçici olarak kaydet
    upload_folder = os.path.join(current_app.root_path, "uploads")
    os.makedirs(upload_folder, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    # OpenAI ile fotoğraf doğrula
    is_valid, message = verify_animal_in_photo(filepath, report.animal_type)

    if not is_valid:
        # Geçersiz fotoğrafı sil
        os.remove(filepath)
        return jsonify({"error": message}), 400

    # Geçerliyse veritabanına kaydet
    image = ReportImage(report_id=report_id, image_url=f"/uploads/{filename}")
    db.session.add(image)
    db.session.commit()
    return jsonify({
        "message": "Fotoğraf yüklendi",
        "image": image.to_dict(),
        "verification": message,
    }), 201


# ─── Bildirim detayı ───────────────────────────────────────────────────────
@reports_bp.route("/<int:report_id>", methods=["GET"])
@jwt_required()
def get_report(report_id):
    report = PetReport.query.get_or_404(report_id)
    return jsonify({"report": report.to_dict()}), 200


# ─── Bildirim durumu güncelle (vet) ────────────────────────────────────────
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


# ─── Bildirime yanıt ver (vet) ─────────────────────────────────────────────
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


# ─── Kullanıcı: veterinere mesaj gönder ───────────────────────────────────
@reports_bp.route("/<int:report_id>/user-message", methods=["POST"])
@jwt_required()
def user_message(report_id):
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")
    if role != "user":
        return jsonify({"error": "Sadece kullanıcılar mesaj gönderebilir"}), 403
    report = PetReport.query.get_or_404(report_id)
    if report.user_id != int(user_id):
        return jsonify({"error": "Bu bildirime mesaj gönderemezsiniz"}), 403
    data = request.get_json()
    if not data.get("message"):
        return jsonify({"error": "Mesaj zorunludur"}), 400
    response = VetResponse(
        report_id=report_id,
        vet_id=int(user_id),
        message=f"👤 İlan Sahibi: {data['message']}",
    )
    db.session.add(response)
    db.session.commit()
    return jsonify({"message": "Mesaj gönderildi", "response": response.to_dict()}), 201


# ─── Bildirimin yanıtlarını getir ─────────────────────────────────────────
@reports_bp.route("/<int:report_id>/responses", methods=["GET"])
@jwt_required()
def get_responses(report_id):
    PetReport.query.get_or_404(report_id)
    responses = (
        VetResponse.query
        .filter_by(report_id=report_id)
        .order_by(VetResponse.created_at.asc())
        .all()
    )
    return jsonify({"responses": [r.to_dict() for r in responses]}), 200


# ─── Bildirim sil ──────────────────────────────────────────────────────────
@reports_bp.route("/<int:report_id>", methods=["DELETE"])
@jwt_required()
def delete_report(report_id):
    user_id = get_jwt_identity()
    report = PetReport.query.get_or_404(report_id)
    if report.user_id != int(user_id):
        return jsonify({"error": "Bu bildirimi silemezsiniz"}), 403
    db.session.delete(report)
    db.session.commit()
    return jsonify({"message": "Bildirim silindi"}), 200


# ─── Bildirim düzenle ──────────────────────────────────────────────────────
@reports_bp.route("/<int:report_id>", methods=["PUT"])
@jwt_required()
def update_report(report_id):
    user_id = get_jwt_identity()
    report = PetReport.query.get_or_404(report_id)
    if report.user_id != int(user_id):
        return jsonify({"error": "Bu bildirimi düzenleyemezsiniz"}), 403
    data = request.get_json()
    if "animal_type" in data and data["animal_type"]:
        report.animal_type = data["animal_type"]
    if "description" in data and data["description"]:
        report.description = data["description"]
    if "location_desc" in data:
        report.location_desc = data["location_desc"]
    if "latitude" in data:
        report.latitude = data["latitude"]
    if "longitude" in data:
        report.longitude = data["longitude"]
    db.session.commit()
    return jsonify({"message": "Bildirim güncellendi", "report": report.to_dict()}), 200


# ─── İlanı kapat - bulunan olarak işaretle ────────────────────────────────
@reports_bp.route("/<int:report_id>/close", methods=["PUT"])
@jwt_required()
def close_report(report_id):
    user_id = get_jwt_identity()
    report = PetReport.query.get_or_404(report_id)
    if report.user_id != int(user_id):
        return jsonify({"error": "Bu bildirimi kapatma yetkiniz yok"}), 403
    report.status = "tamamlandi"
    report.report_type = "bulunan"
    db.session.commit()
    return jsonify({"message": "İlan kapatıldı", "report": report.to_dict()}), 200