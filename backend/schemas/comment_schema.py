from marshmallow import Schema, fields, validate


class CommentUserSchema(Schema):
    user_id = fields.UUID(dump_only=True)
    name = fields.Str()
    email = fields.Email()


class CommentSchema(Schema):
    comment_id = fields.UUID(dump_only=True)
    content = fields.Str(required=True)
    card_id = fields.UUID(dump_only=True)
    user_id = fields.UUID(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    user = fields.Nested(CommentUserSchema, dump_only=True)


class CreateCommentSchema(Schema):
    content = fields.Str(required=True, validate=validate.Length(min=1, max=5000))
