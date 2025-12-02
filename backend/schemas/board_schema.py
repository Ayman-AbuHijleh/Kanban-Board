from marshmallow import Schema, fields, validate, EXCLUDE


class BoardMemberUserSchema(Schema):
    user_id = fields.UUID(dump_only=True)
    name = fields.Str()
    email = fields.Email()
    
    class Meta:
        unknown = EXCLUDE
        ordered = True


class BoardMemberSchema(Schema):
    member_id = fields.UUID(dump_only=True)
    user_id = fields.UUID()
    role = fields.Method("get_role")
    user = fields.Nested(BoardMemberUserSchema, dump_only=True)
    
    def get_role(self, obj):
        """Serialize role enum as lowercase string"""
        if hasattr(obj.role, 'value'):
            return obj.role.value.lower()
        return str(obj.role).lower()
    
    class Meta:
        unknown = EXCLUDE
        ordered = True


class BoardOwnerSchema(Schema):
    user_id = fields.UUID(dump_only=True)
    name = fields.Str()
    email = fields.Email()
    
    class Meta:
        unknown = EXCLUDE
        ordered = True


class BoardSchema(Schema):
    board_id = fields.UUID(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    owner_id = fields.UUID(dump_only=True)
    owner = fields.Nested(BoardOwnerSchema, dump_only=True)
    members = fields.List(fields.Nested(BoardMemberSchema), dump_only=True)
    
    class Meta:
        unknown = EXCLUDE
        ordered = True


class CreateBoardSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    
    class Meta:
        unknown = EXCLUDE


class UpdateBoardSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    
    class Meta:
        unknown = EXCLUDE


class InviteMemberSchema(Schema):
    email = fields.Email(required=True)
    
    class Meta:
        unknown = EXCLUDE


class UpdateMemberRoleSchema(Schema):
    role = fields.Str(
        required=True,
        validate=validate.OneOf(["admin", "editor", "viewer"])
    )
    
    class Meta:
        unknown = EXCLUDE


class BoardMembersResponseSchema(Schema):
    owner = fields.Nested(BoardOwnerSchema, dump_only=True)
    members = fields.List(fields.Nested(BoardMemberSchema), dump_only=True)
    
    class Meta:
        unknown = EXCLUDE
        ordered = True
