from marshmallow import Schema, fields, validate

class CardSchema(Schema):
    card_id = fields.UUID(dump_only=True)
    list_id = fields.UUID(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(min=1, max=150))
    description = fields.Str(allow_none=True)
    due_date = fields.DateTime(allow_none=True)
    position = fields.Int(dump_only=True)

class CreateCardSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=150))
    description = fields.Str(allow_none=True)
    due_date = fields.DateTime(allow_none=True)

class UpdateCardSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=150))
    description = fields.Str(allow_none=True)
    due_date = fields.DateTime(allow_none=True)
    list_id = fields.UUID()  # For moving cards between lists
    position = fields.Int()   # For reordering within a list
