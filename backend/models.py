from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="user")
    phone = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    profile_photo = db.Column(db.String(255), nullable=True)

    clinic_name = db.Column(db.String(150), nullable=True)
    clinic_address = db.Column(db.String(255), nullable=True)
    clinic_hours = db.Column(db.String(100), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    reports = db.relationship("PetReport", backref="owner", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "phone": self.phone,
            "clinic_name": self.clinic_name,
            "clinic_address": self.clinic_address,
            "clinic_hours": self.clinic_hours,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "created_at": self.created_at.isoformat(),
            "profile_photo": self.profile_photo,
        }


class PetReport(db.Model):
    __tablename__ = "pet_reports"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    report_type = db.Column(db.String(20), nullable=False)
    animal_type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default="beklemede")
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    location_desc = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    images = db.relationship("ReportImage", backref="report", lazy=True, cascade="all, delete-orphan")
    vet_responses = db.relationship("VetResponse", backref="report", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.owner.name if self.owner else None,
            "user_photo": self.owner.profile_photo if self.owner else None,
            "report_type": self.report_type,
            "animal_type": self.animal_type,
            "description": self.description,
            "status": self.status,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "location_desc": self.location_desc,
            "images": [img.to_dict() for img in self.images],
            "created_at": self.created_at.isoformat()
        }


class ReportImage(db.Model):
    __tablename__ = "report_images"

    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("pet_reports.id"), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "report_id": self.report_id,
            "image_url": self.image_url,
            "uploaded_at": self.uploaded_at.isoformat()
        }


class VetResponse(db.Model):
    __tablename__ = "vet_responses"

    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("pet_reports.id"), nullable=False)
    vet_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    vet = db.relationship("User", foreign_keys=[vet_id])

    def to_dict(self):
        return {
            "id": self.id,
            "report_id": self.report_id,
            "vet_id": self.vet_id,
            "vet_name": self.vet.name if self.vet else None,
            "vet_clinic": self.vet.clinic_name if self.vet else None,
            "message": self.message,
            "created_at": self.created_at.isoformat()
        }


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    report_id = db.Column(db.Integer, db.ForeignKey("pet_reports.id"), nullable=True)
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sender = db.relationship("User", foreign_keys=[sender_id])
    receiver = db.relationship("User", foreign_keys=[receiver_id])
    report = db.relationship("PetReport", foreign_keys=[report_id])

    def to_dict(self):
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "sender_name": self.sender.name if self.sender else None,
            "sender_photo": self.sender.profile_photo if self.sender else None,
            "receiver_id": self.receiver_id,
            "receiver_name": self.receiver.name if self.receiver else None,
            "report_id": self.report_id,
            "report_animal": self.report.animal_type if self.report else None,
            "content": self.content,
            "image_url": self.image_url,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat()
        }


class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    token = db.Column(db.String(500), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)

    user = db.relationship("User", backref="reset_tokens")