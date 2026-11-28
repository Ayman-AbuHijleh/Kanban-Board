def test_owner_can_create_label_and_attach_it_to_card(
    client,
    user_factory,
    headers_factory,
    board_factory,
    list_factory,
    card_factory,
):
    owner = user_factory()
    board = board_factory(owner)
    board_list = list_factory(board)
    card = card_factory(board_list)
    headers = headers_factory(owner)

    created = client.post(
        f"/api/boards/{board.board_id}/labels",
        json={"name": "Bug", "color": "#ff0000"},
        headers=headers,
    )
    label_id = created.get_json()["data"]["label_id"]
    attached = client.post(
        f"/api/cards/{card.card_id}/labels/{label_id}", headers=headers
    )
    duplicate = client.post(
        f"/api/cards/{card.card_id}/labels/{label_id}", headers=headers
    )
    labels = client.get(f"/api/boards/{board.board_id}/labels", headers=headers)

    assert created.status_code == 201
    assert attached.status_code == 201
    assert duplicate.status_code == 400
    assert labels.status_code == 200
    assert labels.get_json()["data"][0]["name"] == "Bug"


def test_comment_author_can_create_and_delete_comment(
    client,
    user_factory,
    headers_factory,
    board_factory,
    list_factory,
    card_factory,
):
    owner = user_factory()
    board = board_factory(owner)
    board_list = list_factory(board)
    card = card_factory(board_list)
    headers = headers_factory(owner)

    created = client.post(
        f"/api/cards/{card.card_id}/comments",
        json={"content": "Looks good"},
        headers=headers,
    )
    comment_id = created.get_json()["data"]["comment_id"]
    listed = client.get(f"/api/cards/{card.card_id}/comments", headers=headers)
    deleted = client.delete(
        f"/api/cards/{card.card_id}/comments/{comment_id}", headers=headers
    )

    assert created.status_code == 201
    assert created.get_json()["data"]["content"] == "Looks good"
    assert listed.status_code == 200
    assert listed.get_json()["data"][0]["user_id"] == str(owner.user_id)
    assert deleted.status_code == 200


def test_non_author_non_owner_cannot_delete_comment(
    client,
    user_factory,
    headers_factory,
    board_factory,
    member_factory,
    list_factory,
    card_factory,
    comment_factory,
):
    owner = user_factory()
    author = user_factory()
    viewer = user_factory()
    board = board_factory(owner)
    member_factory(board, author)
    member_factory(board, viewer)
    card = card_factory(list_factory(board))
    comment = comment_factory(card, author)

    response = client.delete(
        f"/api/cards/{card.card_id}/comments/{comment.comment_id}",
        headers=headers_factory(viewer),
    )

    assert response.status_code == 403
    assert response.get_json()["message"] == (
        "Only comment author or board owner can delete comments"
    )


def test_label_creation_requires_name_and_color(
    client, user_factory, headers_factory, board_factory
):
    owner = user_factory()
    board = board_factory(owner)

    response = client.post(
        f"/api/boards/{board.board_id}/labels",
        json={"name": "Bug"},
        headers=headers_factory(owner),
    )

    assert response.status_code == 400
