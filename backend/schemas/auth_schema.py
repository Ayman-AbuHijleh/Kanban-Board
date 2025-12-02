from marshmallow import Schema, fields, validate, EXCLUDE


class UserBaseSchema(Schema):
    user_id = fields.UUID(dump_only=True)
    name = fields.Str(validate=validate.Length(min=2, max=100))
    email = fields.Email()
    phone = fields.Str(validate=validate.Length(min=10, max=15))
    password = fields.Str(validate=validate.Length(min=8))

    class Meta:
        unknown = EXCLUDE
        ordered = True


class SignupSchema(UserBaseSchema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True)
    phone = fields.Str(validate=validate.Length(min=10, max=15))
    password = fields.Str(required=True, validate=validate.Length(min=8), load_only=True)


class LoginSchema(UserBaseSchema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8), load_only=True)

    class Meta(UserBaseSchema.Meta):
        fields = ("email", "password")


class UserSchema(UserBaseSchema):
    class Meta(UserBaseSchema.Meta):
        exclude = ("password",)

