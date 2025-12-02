import React from "react";
import type { Board } from "../../types/board";
import "./BoardCard.scss";

interface BoardCardProps {
  board: Board;
  onDelete?: (boardId: string) => void;
  onEdit?: (boardId: string, currentName: string) => void;
  onManageMembers?: (boardId: string) => void;
  onViewBoard?: (boardId: string) => void;
  isOwner: boolean;
}

/**
 * BoardCard component
 * Displays a single board with its name, owner, and members
 */
const BoardCard: React.FC<BoardCardProps> = ({
  board,
  onDelete,
  onEdit,
  onManageMembers,
  onViewBoard,
  isOwner,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      window.confirm(
        `Are you sure you want to delete the board "${board.name}"?`
      )
    ) {
      onDelete?.(board.board_id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(board.board_id, board.name);
  };

  const handleManageMembers = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onManageMembers?.(board.board_id);
  };

  const handleViewBoard = () => {
    onViewBoard?.(board.board_id);
  };

  return (
    <div
      className="board-card"
      onClick={handleViewBoard}
      style={{ cursor: "pointer" }}
    >
      <div className="board-card__header">
        <h3 className="board-card__title">{board.name}</h3>
        {isOwner && (
          <div className="board-card__actions">
            <button
              className="board-card__btn board-card__btn--edit"
              onClick={handleEdit}
              title="Edit board"
            >
              ✏️
            </button>
            <button
              className="board-card__btn board-card__btn--delete"
              onClick={handleDelete}
              title="Delete board"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      <div className="board-card__info">
        <div className="board-card__owner">
          <span className="board-card__label">Owner:</span>
          <span className="board-card__value">{board.owner.name}</span>
        </div>

        <div className="board-card__members">
          <span className="board-card__label">Members:</span>
          <span className="board-card__value">
            {board.members.length > 0
              ? `${board.members.length} member${
                  board.members.length > 1 ? "s" : ""
                }`
              : "No members"}
          </span>
        </div>
      </div>

      {/* Manage Members Button */}
      <button className="board-card__manage-btn" onClick={handleManageMembers}>
        👥 Manage Members
      </button>

      {board.members.length > 0 && (
        <div className="board-card__member-list">
          {board.members.slice(0, 3).map((member) => (
            <div key={member.member_id} className="board-card__member">
              <span className="board-card__member-name">
                {member.user.name}
              </span>
              <span className="board-card__member-role">({member.role})</span>
            </div>
          ))}
          {board.members.length > 3 && (
            <div className="board-card__member-more">
              +{board.members.length - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BoardCard;
