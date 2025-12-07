import React, { useState } from "react";
import { useCreateList } from "../../hooks/useBoardLists";
import { useBoardPermissions } from "../../hooks/useBoardPermissions";
import "./AddListButton.scss";

interface AddListButtonProps {
  boardId: string;
}

const AddListButton: React.FC<AddListButtonProps> = ({ boardId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");

  // Get permissions for the current user
  const { canEdit } = useBoardPermissions(boardId);

  const createListMutation = useCreateList();

  const handleSubmit = () => {
    if (title.trim()) {
      createListMutation.mutate(
        { boardId, payload: { title: title.trim() } },
        {
          onSuccess: () => {
            setTitle("");
            setIsAdding(false);
          },
        }
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      setTitle("");
      setIsAdding(false);
    }
  };

  // Only show the button if user can edit
  if (!canEdit) {
    return null;
  }

  if (isAdding) {
    return (
      <div className="add-list-button add-list-button--form">
        <input
          type="text"
          className="add-list-button__input"
          placeholder="Enter list title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <div className="add-list-button__actions">
          <button
            className="add-list-button__submit"
            onClick={handleSubmit}
            disabled={!title.trim() || createListMutation.isPending}
          >
            Add List
          </button>
          <button
            className="add-list-button__cancel"
            onClick={() => {
              setTitle("");
              setIsAdding(false);
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      className="add-list-button add-list-button--trigger"
      onClick={() => setIsAdding(true)}
    >
      <span>+ Add another list</span>
    </button>
  );
};

export default AddListButton;
