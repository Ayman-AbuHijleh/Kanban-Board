import React from "react";
import type { CardAssignee } from "../../types/card";
import "./CardAssignees.scss";

interface CardAssigneesProps {
  assignees?: CardAssignee[];
  maxDisplay?: number;
}

const CardAssignees: React.FC<CardAssigneesProps> = ({
  assignees,
  maxDisplay = 3,
}) => {
  if (!assignees || assignees.length === 0) {
    return null;
  }

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

  const displayedAssignees = assignees.slice(0, maxDisplay);
  const remainingCount = assignees.length - maxDisplay;

  return (
    <div className="card-assignees">
      {displayedAssignees.map((assignee) => (
        <div
          key={assignee.id}
          className="card-assignees__avatar"
          title={`${assignee.user.name} (${assignee.user.email})`}
        >
          {getInitials(assignee.user.name, assignee.user.email)}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className="card-assignees__avatar card-assignees__avatar--more"
          title={`+${remainingCount} more`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default CardAssignees;
