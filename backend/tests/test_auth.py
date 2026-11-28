def test_signup_returns_user_and_token(client):
    response = client.post(
        "/api/auth/signup",
        json={
            "name": "New User",
            "email": "new@example.com",
            "password": "password123",
            "phone": "1234567890",
        },
    )

    assert response.status_code == 201
    body = response.get_json()
    assert body["message"] == "User registered successfully"
    assert body["token"]
    assert body["user"]["email"] == "new@example.com"
    assert "password" not in body["user"]


def test_signup_rejects_duplicate_email(client):
    payload = {
        "name": "New User",
        "email": "duplicate@example.com",
        "password": "password123",
    }
    assert client.post("/api/auth/signup", json=payload).status_code == 201

    response = client.post("/api/auth/signup", json=payload)

    assert response.status_code == 400
    assert response.get_json()["message"] == "Email already registered"


def test_signup_rejects_invalid_fields(client):
    response = client.post(
        "/api/auth/signup",
        json={"name": "A", "email": "not-an-email", "password": "short"},
    )

    assert response.status_code == 400


def test_login_accepts_correct_password_and_rejects_incorrect_password(
    client, user_factory
):
    user_factory(email="login@example.com", password="password123")

    success = client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )
    failure = client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "wrongpass123"},
    )

    assert success.status_code == 200
    assert success.get_json()["token"]
    assert failure.status_code == 401
    assert failure.get_json()["message"] == "Invalid email or password"


def test_protected_endpoint_requires_valid_bearer_token(client):
    missing = client.get("/api/boards")
    malformed = client.get(
        "/api/boards", headers={"Authorization": "Token not-a-bearer-token"}
    )
    invalid = client.get(
        "/api/boards", headers={"Authorization": "Bearer not-a-jwt"}
    )

    assert missing.status_code == 401
    assert missing.get_json()["message"] == "Token is missing"
    assert malformed.status_code == 401
    assert malformed.get_json()["message"] == "Invalid token header format"
    assert invalid.status_code == 401
    assert invalid.get_json()["message"] == "Token is invalid"
