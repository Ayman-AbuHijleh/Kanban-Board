def test_board_member_can_read_lists_but_viewer_cannot_create(
    client,
    user_factory,
    headers_factory,
    board_factory,
    member_factory,
    list_factory,
):
    owner = user_factory()
    viewer = user_factory()
    board = board_factory(owner)
    member_factory(board, viewer)
    existing = list_factory(board)
    viewer_headers = headers_factory(viewer)

    listed = client.get(
        f"/api/boards/{board.board_id}/lists", headers=viewer_headers
    )
    rejected = client.post(
        f"/api/boards/{board.board_id}/lists",
        json={"title": "Doing"},
        headers=viewer_headers,
    )

    assert listed.status_code == 200
    assert listed.get_json()["data"][0]["list_id"] == str(existing.list_id)
    assert rejected.status_code == 403


def test_owner_can_create_update_move_and_delete_lists(
    client, user_factory, headers_factory, board_factory, list_factory
):
    owner = user_factory()
    board = board_factory(owner)
    first = list_factory(board, "First", 0)
    second = list_factory(board, "Second", 1)
    headers = headers_factory(owner)

    created = client.post(
        f"/api/boards/{board.board_id}/lists",
        json={"title": "Third"},
        headers=headers,
    )
    updated = client.put(
        f"/api/lists/{first.list_id}",
        json={"title": "Updated"},
        headers=headers,
    )
    moved = client.put(
        f"/api/lists/{second.list_id}/move",
        json={"new_position": 0},
        headers=headers,
    )
    deleted = client.delete(f"/api/lists/{first.list_id}", headers=headers)

    assert created.status_code == 201
    assert created.get_json()["data"]["title"] == "Third"
    assert updated.status_code == 200
    assert updated.get_json()["data"]["title"] == "Updated"
    assert moved.status_code == 200
    assert moved.get_json()["data"]["position"] == 0
    assert deleted.status_code == 200


def test_move_list_requires_a_valid_position(
    client, user_factory, headers_factory, board_factory, list_factory
):
    owner = user_factory()
    board = board_factory(owner)
    board_list = list_factory(board)

    missing = client.put(
        f"/api/lists/{board_list.list_id}/move",
        json={},
        headers=headers_factory(owner),
    )
    invalid = client.put(
        f"/api/lists/{board_list.list_id}/move",
        json={"new_position": "later"},
        headers=headers_factory(owner),
    )

    assert missing.status_code == 400
    assert invalid.status_code == 400
