import React, { useState, useEffect } from "react";
import "./CreateBoardModal.scss";

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isLoading?: boolean;
  error?: string;
  editMode?: boolean;
  initialName?: string;
}

/**
 * CreateBoardModal component
 * Modal for creating or editing a board
 */
const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  error,
  editMode = false,
  initialName = "",
}) => {
  const [boardName, setBoardName] = useState(initialName);

  useEffect(() => {
    if (isOpen) {
      setBoardName(initialName);
    }
  }, [isOpen, initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (boardName.trim()) {
      onSubmit(boardName.trim());
    }
  };

  const handleClose = () => {
    setBoardName("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editMode ? "Edit Board" : "Create New Board"}
          </h2>
          <button
            className="modal-close"
            onClick={handleClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="boardName" className="form-label">
                Board Name
              </label>
              <input
                type="text"
                id="boardName"
                className="form-input"
                placeholder="Enter board name"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                disabled={isLoading}
                autoFocus
                maxLength={100}
              />
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !boardName.trim()}
            >
              {isLoading
                ? editMode
                  ? "Updating..."
                  : "Creating..."
                : editMode
                ? "Update Board"
                : "Create Board"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardModal;
