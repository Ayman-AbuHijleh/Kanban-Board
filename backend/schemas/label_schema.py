from marshmallow import Schema, fields, validate

class LabelSchema(Schema):
    label_id = fields.UUID(dump_only=True)
    board_id = fields.UUID(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    color = fields.Str(required=True, validate=validate.Length(min=1, max=20))

class CreateLabelSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    color = fields.Str(required=True, validate=validate.Length(min=1, max=20))

class UpdateLabelSchema(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=50))
    color = fields.Str(validate=validate.Length(min=1, max=20))

class CardLabelSchema(Schema):
    id = fields.UUID(dump_only=True)
    card_id = fields.UUID(dump_only=True)
    label_id = fields.UUID(dump_only=True)
    label = fields.Nested(LabelSchema, dump_only=True)
