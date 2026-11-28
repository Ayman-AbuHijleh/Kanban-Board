def test_user_can_create_and_list_owned_boards(
    client, user_factory, headers_factory
):
    user = user_factory()
    headers = headers_factory(user)

    created = client.post("/api/boards", json={"name": "Sprint"}, headers=headers)
    listed = client.get("/api/boards", headers=headers)

    assert created.status_code == 201
    board = created.get_json()["board"]
    assert board["name"] == "Sprint"
    assert board["owner_id"] == str(user.user_id)
    assert listed.status_code == 200
    assert [item["board_id"] for item in listed.get_json()["boards"]] == [
        board["board_id"]
    ]


def test_board_creation_validates_name(client, user_factory, headers_factory):
    headers = headers_factory(user_factory())

    response = client.post("/api/boards", json={"name": ""}, headers=headers)

    assert response.status_code == 400


def test_nonmember_cannot_read_board_and_owner_can_update_or_delete(
    client, user_factory, headers_factory, board_factory
):
    owner = user_factory()
    other_user = user_factory()
    board = board_factory(owner)

    forbidden = client.get(
        f"/api/boards/{board.board_id}/members",
        headers=headers_factory(other_user),
    )
    updated = client.put(
        f"/api/boards/{board.board_id}",
        json={"name": "Renamed"},
        headers=headers_factory(owner),
    )
    deleted = client.delete(
        f"/api/boards/{board.board_id}", headers=headers_factory(owner)
    )

    assert forbidden.status_code == 403
    assert updated.status_code == 200
    assert updated.get_json()["board"]["name"] == "Renamed"
    assert deleted.status_code == 200


def test_only_board_owner_can_update_board(
    client, user_factory, headers_factory, board_factory, member_factory
):
    owner = user_factory()
    viewer = user_factory()
    board = board_factory(owner)
    member_factory(board, viewer)

    response = client.put(
        f"/api/boards/{board.board_id}",
        json={"name": "Not allowed"},
        headers=headers_factory(viewer),
    )

    assert response.status_code == 403


def test_owner_can_invite_member_and_viewer_cannot_edit_board(
    client, user_factory, headers_factory, board_factory
):
    owner = user_factory()
    invitee = user_factory(email="invitee@example.com")
    board = board_factory(owner)
    owner_headers = headers_factory(owner)

    invited = client.post(
        f"/api/boards/{board.board_id}/invite",
        json={"email": invitee.email},
        headers=owner_headers,
    )
    viewer_headers = headers_factory(invitee)
    visible_members = client.get(
        f"/api/boards/{board.board_id}/members", headers=viewer_headers
    )
    forbidden_update = client.put(
        f"/api/boards/{board.board_id}",
        json={"name": "Forbidden"},
        headers=viewer_headers,
    )

    assert invited.status_code == 201
    assert invited.get_json()["member"]["role"] == "viewer"
    assert visible_members.status_code == 200
    assert forbidden_update.status_code == 403


def test_inviting_unknown_user_returns_not_found(
    client, user_factory, headers_factory, board_factory
):
    owner = user_factory()
    board = board_factory(owner)

    response = client.post(
        f"/api/boards/{board.board_id}/invite",
        json={"email": "absent@example.com"},
        headers=headers_factory(owner),
    )

    assert response.status_code == 404
