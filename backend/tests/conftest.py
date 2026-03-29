import pytest
from app import create_app
from models import db as _db


@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['JWT_SECRET_KEY'] = 'test-secret'
    return app


@pytest.fixture
def client(app):
    with app.app_context():
        _db.create_all()
        yield app.test_client()
        _db.drop_all()