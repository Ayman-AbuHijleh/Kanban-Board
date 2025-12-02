import React, { useState } from "react";
import { useCreateCard } from "../../hooks/useCards";
import "./CreateCardForm.scss";

interface CreateCardFormProps {
  listId: string;
}

const CreateCardForm: React.FC<CreateCardFormProps> = ({ listId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");

  const createCardMutation = useCreateCard();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createCardMutation.mutate(
      {
        listId,
        payload: { title: title.trim() },
      },
      {
        onSuccess: () => {
          setTitle("");
          setIsAdding(false);
        },
      }
    );
  };

  const handleCancel = () => {
    setTitle("");
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isAdding) {
    return (
      <button
        className="create-card-form__trigger"
        onClick={() => setIsAdding(true)}
      >
        + Add a card
      </button>
    );
  }

  return (
    <form className="create-card-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="create-card-form__input"
        placeholder="Enter card title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        disabled={createCardMutation.isPending}
      />
      <div className="create-card-form__actions">
        <button
          type="submit"
          className="create-card-form__btn create-card-form__btn--add"
          disabled={!title.trim() || createCardMutation.isPending}
        >
          {createCardMutation.isPending ? "Adding..." : "Add"}
        </button>
        <button
          type="button"
          className="create-card-form__btn create-card-form__btn--cancel"
          onClick={handleCancel}
          disabled={createCardMutation.isPending}
        >
          ✕
        </button>
      </div>
    </form>
  );
};

export default CreateCardForm;
