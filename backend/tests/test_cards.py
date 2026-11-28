def test_owner_can_create_list_cards_and_update_card(
    client, user_factory, headers_factory, board_factory, list_factory
):
    owner = user_factory()
    board = board_factory(owner)
    board_list = list_factory(board)
    headers = headers_factory(owner)

    created = client.post(
        f"/api/lists/{board_list.list_id}/cards",
        json={
            "title": "Implement API",
            "description": "Add endpoint tests",
            "due_date": "2026-12-01",
        },
        headers=headers,
    )
    card_data = created.get_json()["data"]
    updated = client.put(
        f"/api/cards/{card_data['card_id']}",
        json={"title": "Test API"},
        headers=headers,
    )
    listed = client.get(
        f"/api/lists/{board_list.list_id}/cards", headers=headers
    )

    assert created.status_code == 201
    assert card_data["position"] == 0
    assert updated.status_code == 200
    assert updated.get_json()["data"]["title"] == "Test API"
    assert listed.status_code == 200
    assert listed.get_json()["data"][0]["title"] == "Test API"


def test_card_creation_rejects_invalid_date(
    client, user_factory, headers_factory, board_factory, list_factory
):
    owner = user_factory()
    board_list = list_factory(board_factory(owner))

    response = client.post(
        f"/api/lists/{board_list.list_id}/cards",
        json={"title": "Invalid date", "due_date": "not-a-date"},
        headers=headers_factory(owner),
    )

    assert response.status_code == 400


def test_viewer_cannot_create_card_and_owner_can_delete_card(
    client,
    user_factory,
    headers_factory,
    board_factory,
    member_factory,
    list_factory,
    card_factory,
):
    owner = user_factory()
    viewer = user_factory()
    board = board_factory(owner)
    member_factory(board, viewer)
    board_list = list_factory(board)
    card = card_factory(board_list)

    rejected = client.post(
        f"/api/lists/{board_list.list_id}/cards",
        json={"title": "Not allowed"},
        headers=headers_factory(viewer),
    )
    deleted = client.delete(
        f"/api/cards/{card.card_id}", headers=headers_factory(owner)
    )

    assert rejected.status_code == 403
    assert deleted.status_code == 200


def test_card_cannot_be_moved_to_another_board(
    client,
    user_factory,
    headers_factory,
    board_factory,
    list_factory,
    card_factory,
):
    owner = user_factory()
    board = board_factory(owner)
    other_board = board_factory(owner, "Other Board")
    source = list_factory(board)
    target = list_factory(other_board)
    card = card_factory(source)

    response = client.put(
        f"/api/cards/{card.card_id}/move",
        json={"new_list_id": str(target.list_id), "new_position": 0},
        headers=headers_factory(owner),
    )

    assert response.status_code == 400
    assert response.get_json()["message"] == "Cannot move card to a different board"
