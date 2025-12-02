from marshmallow import Schema, fields, validate

class ListSchema(Schema):
    list_id = fields.UUID(dump_only=True)
    board_id = fields.UUID(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    position = fields.Int(dump_only=True)

class CreateListSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=100))

class UpdateListSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=100))
    position = fields.Int()
