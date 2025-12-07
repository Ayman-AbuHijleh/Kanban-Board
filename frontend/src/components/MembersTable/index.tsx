import React from "react";
import RoleSelector from "../RoleSelector";
import type { BoardMember, User } from "../../types/board";
import "./MembersTable.scss";

interface MembersTableProps {
  owner: User;
  members: BoardMember[];
  isOwner: boolean;
  isAdmin: boolean;
  onRoleChange: (
    userId: string,
    newRole: "admin" | "editor" | "viewer"
  ) => void;
  onRemoveMember?: (userId: string) => void;
  isUpdating?: boolean;
}

/**
 * MembersTable component
 * Displays board owner and members with role management
 */
const MembersTable: React.FC<MembersTableProps> = ({
  owner,
  members,
  isOwner,
  isAdmin,
  onRoleChange,
  onRemoveMember,
  isUpdating = false,
}) => {
  const canManageMembers = isOwner || isAdmin;
  return (
    <div className="members-table">
      <div className="members-table__header">
        <h3 className="members-table__title">Board Members</h3>
        <p className="members-table__count">
          {members.length + 1} {members.length === 0 ? "member" : "members"}
        </p>
      </div>

      <div className="members-table__content">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              {canManageMembers && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {/* Owner Row */}
            <tr className="table__row table__row--owner">
              <td className="table__cell">
                <div className="member-info">
                  <span className="member-info__name">{owner.name}</span>
                  <span className="member-info__badge">Owner</span>
                </div>
              </td>
              <td className="table__cell">{owner.email}</td>
              <td className="table__cell">
                <span className="role-badge role-badge--owner">Owner</span>
              </td>
              {canManageMembers && <td className="table__cell"></td>}
            </tr>

            {/* Members Rows */}
            {members.length === 0 ? (
              <tr>
                <td colSpan={canManageMembers ? 4 : 3} className="table__empty">
                  No members yet. Invite someone to collaborate!
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.member_id} className="table__row">
                  <td className="table__cell">
                    <span className="member-info__name">
                      {member.user.name}
                    </span>
                  </td>
                  <td className="table__cell">{member.user.email}</td>
                  <td className="table__cell">
                    {canManageMembers ? (
                      <RoleSelector
                        currentRole={member.role}
                        onRoleChange={(newRole) =>
                          onRoleChange(member.user.user_id, newRole)
                        }
                        disabled={isUpdating}
                      />
                    ) : (
                      <span className={`role-badge role-badge--${member.role}`}>
                        {member.role.charAt(0).toUpperCase() +
                          member.role.slice(1)}
                      </span>
                    )}
                  </td>
                  {canManageMembers && (
                    <td className="table__cell">
                      <button
                        className="table__remove-btn"
                        onClick={() => onRemoveMember?.(member.user.user_id)}
                        disabled={isUpdating}
                        title="Remove member"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MembersTable;
