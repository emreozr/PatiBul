import json


def test_register_basarili(client):
    response = client.post('/api/auth/register',
        data=json.dumps({
            'email': 'test@patibul.com',
            'password': 'Sifre1234',
            'name': 'Test Kullanici',
            'role': 'user'
        }),
        content_type='application/json'
    )
    assert response.status_code == 201


def test_login_basarili(client):
    client.post('/api/auth/register',
        data=json.dumps({
            'email': 'giris@patibul.com',
            'password': 'Sifre1234',
            'name': 'Giris Kullanici',
            'role': 'user'
        }),
        content_type='application/json'
    )
    response = client.post('/api/auth/login',
        data=json.dumps({
            'email': 'giris@patibul.com',
            'password': 'Sifre1234'
        }),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'access_token' in data


def test_login_yanlis_sifre(client):
    client.post('/api/auth/register',
        data=json.dumps({
            'email': 'yanlis@patibul.com',
            'password': 'DogruSifre',
            'name': 'Test',
            'role': 'user'
        }),
        content_type='application/json'
    )
    response = client.post('/api/auth/login',
        data=json.dumps({
            'email': 'yanlis@patibul.com',
            'password': 'YanlisSSifre'
        }),
        content_type='application/json'
    )
    assert response.status_code == 401


def test_profil_token_olmadan(client):
    response = client.get('/api/user/profile')
    assert response.status_code == 401