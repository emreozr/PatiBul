from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, User, PetReport, Message
from app import mail
from config import Config
from flask_mail import Message as MailMessage
from sqlalchemy import func
from datetime import datetime, timedelta

admin_bp = Blueprint("admin", __name__)


def require_admin():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Bu işlem için admin yetkisi gereklidir"}), 403
    return None


# ─── Genel istatistikler ──────────────────────────────────────────────────
@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    err = require_admin()
    if err:
        return err

    total_users = User.query.filter_by(role="user").count()
    total_vets = User.query.filter_by(role="vet").count()
    pending_vets = User.query.filter_by(role="vet", is_approved=False).count()
    approved_vets = User.query.filter_by(role="vet", is_approved=True).count()
    total_reports = PetReport.query.count()
    active_reports = PetReport.query.filter(PetReport.status != "tamamlandi").count()
    completed_reports = PetReport.query.filter_by(status="tamamlandi").count()
    total_messages = Message.query.count()

    # Son 7 günlük ilanlar
    week_ago = datetime.utcnow() - timedelta(days=7)
    reports_this_week = PetReport.query.filter(PetReport.created_at >= week_ago).count()
    users_this_week = User.query.filter(User.created_at >= week_ago, User.role == "user").count()

    # İlan türü dağılımı
    kayip = PetReport.query.filter_by(report_type="kayip").count()
    bulunan = PetReport.query.filter_by(report_type="bulunan").count()
    yarali = PetReport.query.filter_by(report_type="yarali").count()

    return jsonify({
        "users": {
            "total": total_users,
            "this_week": users_this_week,
        },
        "vets": {
            "total": total_vets,
            "pending": pending_vets,
            "approved": approved_vets,
        },
        "reports": {
            "total": total_reports,
            "active": active_reports,
            "completed": completed_reports,
            "this_week": reports_this_week,
            "kayip": kayip,
            "bulunan": bulunan,
            "yarali": yarali,
        },
        "messages": {
            "total": total_messages,
        },
    }), 200


# ─── Tüm kullanıcılar ─────────────────────────────────────────────────────
@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def get_all_users():
    err = require_admin()
    if err:
        return err

    users = User.query.filter_by(role="user").order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        user_dict = u.to_dict()
        user_dict["report_count"] = PetReport.query.filter_by(user_id=u.id).count()
        user_dict["message_count"] = Message.query.filter_by(sender_id=u.id).count()
        result.append(user_dict)

    return jsonify({"users": result}), 200


# ─── Onay bekleyen veterinerler ───────────────────────────────────────────
@admin_bp.route("/vets/pending", methods=["GET"])
@jwt_required()
def get_pending_vets():
    err = require_admin()
    if err:
        return err

    vets = User.query.filter_by(role="vet", is_approved=False).order_by(User.created_at.desc()).all()
    return jsonify({"vets": [v.to_dict() for v in vets]}), 200


# ─── Tüm veterinerler ─────────────────────────────────────────────────────
@admin_bp.route("/vets", methods=["GET"])
@jwt_required()
def get_all_vets():
    err = require_admin()
    if err:
        return err

    vets = User.query.filter_by(role="vet").order_by(User.created_at.desc()).all()
    result = []
    for v in vets:
        vet_dict = v.to_dict()
        vet_dict["response_count"] = Message.query.filter_by(sender_id=v.id).count()
        result.append(vet_dict)

    return jsonify({"vets": result}), 200


# ─── Veteriner onayla ─────────────────────────────────────────────────────
@admin_bp.route("/vets/<int:vet_id>/approve", methods=["POST"])
@jwt_required()
def approve_vet(vet_id):
    err = require_admin()
    if err:
        return err

    vet = db.session.get(User, vet_id)
    if not vet or vet.role != "vet":
        return jsonify({"error": "Veteriner bulunamadı"}), 404

    vet.is_approved = True
    db.session.commit()

    try:
        msg = MailMessage(
            subject="PatiBul - Veteriner Hesabınız Onaylandı 🎉",
            sender=Config.MAIL_DEFAULT_SENDER,
            recipients=[vet.email]
        )
        msg.html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 30px; background: #f9f9f9; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #3DAA6E; font-size: 28px; margin: 0;">🐾 PatiBul</h1>
            </div>
            <h2 style="color: #333;">Hesabınız Onaylandı! 🎉</h2>
            <p style="color: #555; font-size: 15px;">Merhaba <strong>{vet.name}</strong>,</p>
            <p style="color: #555; font-size: 15px;">
                Veteriner hesabınız onaylanmıştır. Artık PatiBul uygulamasına giriş yapabilirsiniz.
            </p>
            <div style="text-align: center; margin: 32px 0;">
                <div style="background: #E8F5E9; border-radius: 12px; padding: 20px;">
                    <p style="color: #3DAA6E; font-size: 18px; font-weight: bold; margin: 0;">✅ Hesabınız Aktif</p>
                </div>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #bbb; font-size: 12px; text-align: center;">PatiBul — Kayıp Hayvan Takip Sistemi</p>
        </div>
        """
        mail.send(msg)
    except Exception as e:
        print(f"Onay mail hatası: {str(e)}")

    return jsonify({"message": f"{vet.name} onaylandı", "vet": vet.to_dict()}), 200


# ─── Veteriner reddet ─────────────────────────────────────────────────────
@admin_bp.route("/vets/<int:vet_id>/reject", methods=["POST"])
@jwt_required()
def reject_vet(vet_id):
    err = require_admin()
    if err:
        return err

    vet = db.session.get(User, vet_id)
    if not vet or vet.role != "vet":
        return jsonify({"error": "Veteriner bulunamadı"}), 404

    data = request.get_json() or {}
    reason = data.get("reason", "Belirtilmedi")

    try:
        msg = MailMessage(
            subject="PatiBul - Veteriner Hesap Talebiniz Hakkında",
            sender=Config.MAIL_DEFAULT_SENDER,
            recipients=[vet.email]
        )
        msg.html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 30px; background: #f9f9f9; border-radius: 12px;">
            <h1 style="color: #3DAA6E;">🐾 PatiBul</h1>
            <h2>Hesap Talebiniz Hakkında</h2>
            <p>Merhaba <strong>{vet.name}</strong>,</p>
            <p>Üzgünüz, veteriner hesap talebiniz onaylanamadı.</p>
            <div style="background: #FFF3CD; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <p style="color: #856404; margin: 0;"><strong>Sebep:</strong> {reason}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #bbb; font-size: 12px; text-align: center;">PatiBul — Kayıp Hayvan Takip Sistemi</p>
        </div>
        """
        mail.send(msg)
    except Exception as e:
        print(f"Red mail hatası: {str(e)}")

    db.session.delete(vet)
    db.session.commit()

    return jsonify({"message": f"{vet.name} reddedildi"}), 200


# ─── Son ilanlar (filtreli) ───────────────────────────────────────────────
@admin_bp.route("/reports/recent", methods=["GET"])
@jwt_required()
def get_recent_reports():
    err = require_admin()
    if err:
        return err

    report_type = request.args.get("type")  # kayip, bulunan, yarali
    status = request.args.get("status")     # beklemede, inceleniyor, tamamlandi

    query = PetReport.query
    if report_type:
        query = query.filter_by(report_type=report_type)
    if status == 'active':
        # Aktif = tamamlanmamış
        query = query.filter(PetReport.status != 'tamamlandi')
    elif status:
        query = query.filter_by(status=status)

    reports = query.order_by(PetReport.created_at.desc()).limit(50).all()
    return jsonify({"reports": [r.to_dict() for r in reports]}), 200


# ─── Kullanıcı sil ────────────────────────────────────────────────────────
@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    err = require_admin()
    if err:
        return err

    user = db.session.get(User, user_id)
    if not user or user.role == "admin":
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": f"{user.name} silindi"}), 200


# ─── Kullanıcının ilanlarını getir ────────────────────────────────────────
@admin_bp.route("/users/<int:user_id>/reports", methods=["GET"])
@jwt_required()
def get_user_reports(user_id):
    err = require_admin()
    if err:
        return err

    reports = PetReport.query.filter_by(user_id=user_id).order_by(PetReport.created_at.desc()).all()
    return jsonify({"reports": [r.to_dict() for r in reports]}), 200


# ─── İlan sil (admin) ─────────────────────────────────────────────────────
@admin_bp.route("/reports/<int:report_id>", methods=["DELETE"])
@jwt_required()
def delete_report(report_id):
    err = require_admin()
    if err:
        return err

    report = db.session.get(PetReport, report_id)
    if not report:
        return jsonify({"error": "İlan bulunamadı"}), 404

    db.session.delete(report)
    db.session.commit()
    return jsonify({"message": "İlan silindi"}), 200