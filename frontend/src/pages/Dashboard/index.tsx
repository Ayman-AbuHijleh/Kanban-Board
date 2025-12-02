import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBoards } from "../../hooks/useBoards";
import { getCurrentUser } from "../../services/authService";
import BoardCard from "../../components/BoardCard";
import CreateBoardModal from "../../components/CreateBoardModal";
import "./Dashboard.scss";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const {
    boards,
    isLoading,
    isError,
    createBoard,
    isCreating,
    updateBoard,
    isUpdating,
    deleteBoard,
    isDeleting,
    error,
    setError,
  } = useBoards();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleCreateBoard = (name: string) => {
    createBoard(
      { name },
      {
        onSuccess: () => {
          setIsCreateModalOpen(false);
        },
      }
    );
  };

  const handleUpdateBoard = (name: string) => {
    if (editingBoard) {
      updateBoard(
        { boardId: editingBoard.id, payload: { name } },
        {
          onSuccess: () => {
            setEditingBoard(null);
          },
        }
      );
    }
  };

  const handleEditClick = (boardId: string, currentName: string) => {
    setEditingBoard({ id: boardId, name: currentName });
  };

  const handleDeleteBoard = (boardId: string) => {
    deleteBoard(boardId);
  };

  const handleManageMembers = (boardId: string) => {
    navigate(`/boards/${boardId}/members`);
  };

  const handleViewBoard = (boardId: string) => {
    navigate(`/boards/${boardId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingBoard(null);
    setError("");
  };

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__header-content">
          <h1 className="dashboard__title">My Boards</h1>
          <div className="dashboard__user-info">
            <span className="dashboard__user-name">
              {currentUser?.name || "User"}
            </span>
            <button className="dashboard__logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard__main">
        <div className="dashboard__actions">
          <button
            className="dashboard__create-btn"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Create New Board
          </button>
        </div>

        {isLoading && (
          <div className="dashboard__loading">Loading boards...</div>
        )}

        {isError && (
          <div className="dashboard__error">
            Failed to load boards. Please try again.
          </div>
        )}

        {!isLoading && !isError && boards.length === 0 && (
          <div className="dashboard__empty">
            <h2>No boards yet</h2>
            <p>Create your first board to get started!</p>
          </div>
        )}

        {!isLoading && !isError && boards.length > 0 && (
          <div className="dashboard__boards">
            {boards.map((board) => (
              <BoardCard
                key={board.board_id}
                board={board}
                isOwner={board.owner_id === currentUser?.user_id}
                onEdit={handleEditClick}
                onDelete={handleDeleteBoard}
                onManageMembers={handleManageMembers}
                onViewBoard={handleViewBoard}
              />
            ))}
          </div>
        )}

        {(isDeleting || isUpdating) && (
          <div className="dashboard__overlay">
            <div className="dashboard__spinner">Processing...</div>
          </div>
        )}
      </main>

      {/* Create Board Modal */}
      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateBoard}
        isLoading={isCreating}
        error={error}
      />

      {/* Edit Board Modal */}
      {editingBoard && (
        <CreateBoardModal
          isOpen={true}
          onClose={handleCloseModal}
          onSubmit={handleUpdateBoard}
          isLoading={isUpdating}
          error={error}
          editMode={true}
          initialName={editingBoard.name}
        />
      )}
    </div>
  );
};

export default Dashboard;
