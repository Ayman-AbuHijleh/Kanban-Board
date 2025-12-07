from marshmallow import Schema, fields, validate
from schemas.label_schema import CardLabelSchema


class CardAssigneeUserSchema(Schema):
    user_id = fields.UUID(dump_only=True)
    name = fields.Str()
    email = fields.Email()


class CardAssigneeSchema(Schema):
    id = fields.UUID(dump_only=True)
    card_id = fields.UUID(dump_only=True)
    user_id = fields.UUID(dump_only=True)
    user = fields.Nested(CardAssigneeUserSchema, dump_only=True)


class CardSchema(Schema):
    card_id = fields.UUID(dump_only=True)
    list_id = fields.UUID(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(min=1, max=150))
    description = fields.Str(allow_none=True)
    due_date = fields.Date(allow_none=True)
    position = fields.Int(dump_only=True)
    labels = fields.List(fields.Nested(CardLabelSchema), dump_only=True)
    assignees = fields.List(fields.Nested(CardAssigneeSchema), dump_only=True)

class CreateCardSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=150))
    description = fields.Str(allow_none=True)
    due_date = fields.Date(allow_none=True)

class UpdateCardSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=150))
    description = fields.Str(allow_none=True)
    due_date = fields.Date(allow_none=True)
    list_id = fields.UUID()  # For moving cards between lists
    position = fields.Int()   # For reordering within a list
