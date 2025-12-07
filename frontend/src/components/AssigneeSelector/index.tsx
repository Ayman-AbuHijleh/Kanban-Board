import React from "react";
import type { User, BoardMember } from "../../types/board";
import type { CardAssignee } from "../../types/card";
import "./AssigneeSelector.scss";

interface AssigneeSelectorProps {
  boardOwner: User;
  boardMembers: BoardMember[];
  assignedUsers: CardAssignee[];
  onAssign: (userId: string, userName: string, userEmail: string) => void;
  onUnassign: (userId: string) => void;
}

const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  boardOwner,
  boardMembers,
  assignedUsers,
  onAssign,
  onUnassign,
}) => {
  const isUserAssigned = (userId: string) => {
    return assignedUsers.some((assignee) => assignee.user_id === userId);
  };

  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const handleToggle = (
    userId: string,
    userName: string,
    userEmail: string
  ) => {
    if (isUserAssigned(userId)) {
      onUnassign(userId);
    } else {
      onAssign(userId, userName, userEmail);
    }
  };

  // Combine owner and members into a single list
  const allUsers: Array<{
    userId: string;
    name: string;
    email: string;
    isOwner?: boolean;
  }> = [
    {
      userId: boardOwner.user_id,
      name: boardOwner.name,
      email: boardOwner.email,
      isOwner: true,
    },
    ...boardMembers.map((member) => ({
      userId: member.user.user_id,
      name: member.user.name,
      email: member.user.email,
    })),
  ];

  const assignedCount = assignedUsers.length;
  const totalCount = allUsers.length;

  return (
    <div className="assignee-selector">
      <h4 className="assignee-selector__title">
        Assignees ({assignedCount} of {totalCount} assigned)
      </h4>
      <p className="assignee-selector__hint">
        {assignedCount === 0
          ? "No members assigned yet. Click a member below to assign them."
          : "Click to assign/unassign members to this card"}
      </p>

      <div className="assignee-selector__list">
        {allUsers.map((user) => {
          const assigned = isUserAssigned(user.userId);
          return (
            <div
              key={user.userId}
              className={`assignee-selector__item ${
                assigned ? "assignee-selector__item--assigned" : ""
              }`}
              onClick={() => handleToggle(user.userId, user.name, user.email)}
            >
              <div className="assignee-selector__avatar">
                {getInitials(user.name, user.email)}
              </div>
              <div className="assignee-selector__info">
                <span className="assignee-selector__name">
                  {user.name}
                  {user.isOwner && (
                    <span className="assignee-selector__badge">Owner</span>
                  )}
                </span>
                <span className="assignee-selector__email">{user.email}</span>
              </div>
              {assigned && <span className="assignee-selector__check">✓</span>}
            </div>
          );
        })}
      </div>

      {allUsers.length === 0 && (
        <p className="assignee-selector__empty">No members to assign</p>
      )}
    </div>
  );
};

export default AssigneeSelector;
