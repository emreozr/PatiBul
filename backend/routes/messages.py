import os
import uuid

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Message, User, PetReport
from sqlalchemy import or_, and_

messages_bp = Blueprint("messages", __name__)


# ─── Mesaj gönder ──────────────────────────────────────────────────────────
@messages_bp.route("/", methods=["POST"])
@jwt_required()
def send_message():
    sender_id = int(get_jwt_identity())
    data = request.get_json()

    receiver_id = data.get("receiver_id")
    content = data.get("content")
    report_id = data.get("report_id")

    if not receiver_id or not content:
        return jsonify({"error": "receiver_id ve content zorunludur"}), 400

    if sender_id == receiver_id:
        return jsonify({"error": "Kendinize mesaj gönderemezsiniz"}), 400

    receiver = db.session.get(User, receiver_id)
    if not receiver:
        return jsonify({"error": "Alıcı bulunamadı"}), 404

    message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        report_id=report_id,
        content=content,
    )
    db.session.add(message)
    db.session.commit()

    return jsonify({"message": "Mesaj gönderildi", "data": message.to_dict()}), 201


# ─── Mesaja fotoğraf ekle ──────────────────────────────────────────────────
@messages_bp.route("/<int:message_id>/upload-image", methods=["POST"])
@jwt_required()
def upload_message_image(message_id):
    user_id = int(get_jwt_identity())
    message = db.session.get(Message, message_id)

    if not message or message.sender_id != user_id:
        return jsonify({"error": "Mesaj bulunamadı"}), 404

    if "image" not in request.files:
        return jsonify({"error": "Fotoğraf seçilmedi"}), 400

    file = request.files["image"]
    allowed = {"png", "jpg", "jpeg", "gif"}
    ext = file.filename.rsplit(".", 1)[-1].lower()

    if ext not in allowed:
        return jsonify({"error": "Geçersiz dosya türü"}), 400

    upload_folder = os.path.join(current_app.root_path, "uploads")
    os.makedirs(upload_folder, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{ext}"
    file.save(os.path.join(upload_folder, filename))

    message.image_url = f"/uploads/{filename}"
    db.session.commit()

    return jsonify({"message": "Fotoğraf yüklendi", "image_url": message.image_url}), 200


# ─── Gelen kutusu (konuşma listesi) ───────────────────────────────────────
@messages_bp.route("/inbox", methods=["GET"])
@jwt_required()
def get_inbox():
    user_id = int(get_jwt_identity())

    all_messages = Message.query.filter(
        or_(Message.sender_id == user_id, Message.receiver_id == user_id)
    ).order_by(Message.created_at.desc()).all()

    conversations = {}
    for msg in all_messages:
        other_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
        if other_id not in conversations:
            other_user = db.session.get(User, other_id)
            unread_count = Message.query.filter(
                Message.sender_id == other_id,
                Message.receiver_id == user_id,
                Message.is_read == False
            ).count()
            conversations[other_id] = {
                "other_user_id": other_id,
                "other_user_name": other_user.name if other_user else "Bilinmiyor",
                "other_user_photo": other_user.profile_photo if other_user else None,
                "last_message": msg.content,
                "last_message_time": msg.created_at.isoformat(),
                "is_last_mine": msg.sender_id == user_id,
                "unread_count": unread_count,
                "report_id": msg.report_id,
                "report_animal": msg.report.animal_type if msg.report else None,
            }

    return jsonify({"conversations": list(conversations.values())}), 200


# ─── İki kullanıcı arasındaki mesajlar ────────────────────────────────────
@messages_bp.route("/conversation/<int:other_user_id>", methods=["GET"])
@jwt_required()
def get_conversation(other_user_id):
    user_id = int(get_jwt_identity())

    messages = Message.query.filter(
        or_(
            and_(Message.sender_id == user_id, Message.receiver_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.receiver_id == user_id),
        )
    ).order_by(Message.created_at.asc()).all()

    Message.query.filter(
        Message.sender_id == other_user_id,
        Message.receiver_id == user_id,
        Message.is_read == False
    ).update({"is_read": True})
    db.session.commit()

    other_user = db.session.get(User, other_user_id)

    return jsonify({
        "messages": [m.to_dict() for m in messages],
        "other_user": {
            "id": other_user.id,
            "name": other_user.name,
            "photo": other_user.profile_photo,
        } if other_user else None
    }), 200


# ─── Okunmamış mesaj sayısı ────────────────────────────────────────────────
@messages_bp.route("/unread-count", methods=["GET"])
@jwt_required()
def get_unread_count():
    user_id = int(get_jwt_identity())
    count = Message.query.filter(
        Message.receiver_id == user_id,
        Message.is_read == False
    ).count()
    return jsonify({"unread_count": count}), 200