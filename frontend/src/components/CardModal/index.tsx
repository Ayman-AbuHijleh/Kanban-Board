import React, { useState } from "react";
import type { Card } from "../../types/card";
import { useUpdateCard, useDeleteCard } from "../../hooks/useCards";
import "./CardModal.scss";

interface CardModalProps {
  card: Card;
  isOpen: boolean;
  onClose: () => void;
}

const CardModal: React.FC<CardModalProps> = ({ card, isOpen, onClose }) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState(
    card.due_date ? card.due_date.split("T")[0] : ""
  );

  const updateCardMutation = useUpdateCard();
  const deleteCardMutation = useDeleteCard();

  const handleSave = () => {
    if (!title.trim()) return;

    updateCardMutation.mutate(
      {
        cardId: card.card_id,
        payload: {
          title: title.trim(),
          description: description.trim() || undefined,
          due_date: dueDate || undefined,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleDelete = () => {
    if (window.confirm(`Delete card "${card.title}"?`)) {
      deleteCardMutation.mutate(
        {
          cardId: card.card_id,
          listId: card.list_id,
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="card-modal-backdrop" onClick={handleBackdropClick}>
      <div className="card-modal">
        <div className="card-modal__header">
          <h2 className="card-modal__title-label">Card Details</h2>
          <button
            className="card-modal__close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="card-modal__body">
          <div className="card-modal__field">
            <label htmlFor="card-title" className="card-modal__label">
              Title
            </label>
            <input
              id="card-title"
              type="text"
              className="card-modal__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter card title"
            />
          </div>

          <div className="card-modal__field">
            <label htmlFor="card-description" className="card-modal__label">
              Description
            </label>
            <textarea
              id="card-description"
              className="card-modal__textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a more detailed description..."
              rows={4}
            />
          </div>

          <div className="card-modal__field">
            <label htmlFor="card-due-date" className="card-modal__label">
              Due Date
            </label>
            <input
              id="card-due-date"
              type="date"
              className="card-modal__input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="card-modal__footer">
          <button
            className="card-modal__btn card-modal__btn--save"
            onClick={handleSave}
            disabled={!title.trim() || updateCardMutation.isPending}
          >
            {updateCardMutation.isPending ? "Saving..." : "Save"}
          </button>
          <button
            className="card-modal__btn card-modal__btn--delete"
            onClick={handleDelete}
            disabled={deleteCardMutation.isPending}
          >
            {deleteCardMutation.isPending ? "Deleting..." : "Delete"}
          </button>
          <button
            className="card-modal__btn card-modal__btn--cancel"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
