import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Card } from "../../types/card";
import {
  useUpdateCard,
  useDeleteCard,
  useAssignUserToCard,
  useUnassignUserFromCard,
} from "../../hooks/useCards";
import {
  useAddLabelToCard,
  useRemoveLabelFromCard,
} from "../../hooks/useLabels";
import { useBoardMembers } from "../../hooks/useBoardMembers";
import { useCardComments, useCreateComment } from "../../hooks/useComments";
import { useBoardPermissions } from "../../hooks/useBoardPermissions";
import LabelPicker from "../LabelPicker";
import CardLabels from "../CardLabels";
import AssigneeSelector from "../AssigneeSelector";
import CommentList from "../CommentList";
import AddComment from "../AddComment";
import "./CardModal.scss";

interface CardModalProps {
  card: Card;
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

const CardModal: React.FC<CardModalProps> = ({
  card,
  boardId,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState(
    card.due_date ? card.due_date.split("T")[0] : ""
  );

  // Get permissions for the current user
  const { canEdit, canDelete } = useBoardPermissions(boardId);

  const updateCardMutation = useUpdateCard();
  const deleteCardMutation = useDeleteCard();
  const addLabelMutation = useAddLabelToCard();
  const removeLabelMutation = useRemoveLabelFromCard();
  const assignUserMutation = useAssignUserToCard();
  const unassignUserMutation = useUnassignUserFromCard();

  const { owner, members } = useBoardMembers(boardId);
  const { data: comments = [], isLoading: commentsLoading } = useCardComments(
    card.card_id
  );
  const createCommentMutation = useCreateComment();

  // Get the latest card data from cache (includes optimistic updates)
  const cachedCards = queryClient.getQueryData<Card[]>(["cards", card.list_id]);
  const currentCard =
    cachedCards?.find((c) => c.card_id === card.card_id) || card;

  const handleLabelToggle = (labelId: string) => {
    const isLabelAttached = currentCard.labels?.some(
      (cardLabel) => cardLabel.label_id === labelId
    );

    if (isLabelAttached) {
      removeLabelMutation.mutate({
        cardId: card.card_id,
        labelId,
        listId: card.list_id,
      });
    } else {
      addLabelMutation.mutate({
        cardId: card.card_id,
        labelId,
        listId: card.list_id,
      });
    }
  };

  const handleAssignUser = (
    userId: string,
    userName: string,
    userEmail: string
  ) => {
    assignUserMutation.mutate({
      cardId: card.card_id,
      userId,
      listId: card.list_id,
      userName,
      userEmail,
    });
  };

  const handleUnassignUser = (userId: string) => {
    unassignUserMutation.mutate({
      cardId: card.card_id,
      userId,
      listId: card.list_id,
    });
  };

  const handleAddComment = (content: string) => {
    console.log("handleAddComment called with:", content);
    console.log("Card ID:", card.card_id);
    createCommentMutation.mutate({
      cardId: card.card_id,
      payload: { content },
    });
  };

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
          <h2 className="card-modal__title-label">{title || "Card Details"}</h2>
          <button
            className="card-modal__close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="card-modal__body">
          <div className="card-modal__main-content">
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
                disabled={!canEdit}
              />
            </div>

            <div className="card-modal__field">
              <label className="card-modal__label">Labels</label>
              <CardLabels labels={currentCard.labels} />
              {canEdit && (
                <LabelPicker
                  boardId={boardId}
                  selectedLabelIds={
                    currentCard.labels?.map((cl) => cl.label_id) || []
                  }
                  onLabelToggle={handleLabelToggle}
                />
              )}
            </div>

            {owner && (
              <div className="card-modal__field">
                <label className="card-modal__label">Members</label>
                <AssigneeSelector
                  boardOwner={owner}
                  boardMembers={members}
                  assignedUsers={currentCard.assignees || []}
                  onAssign={canEdit ? handleAssignUser : () => {}}
                  onUnassign={canEdit ? handleUnassignUser : () => {}}
                />
              </div>
            )}

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
                disabled={!canEdit}
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
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="card-modal__sidebar">
            <div className="card-modal__section-title">
              💬 Comments and activity
            </div>
            <CommentList comments={comments} isLoading={commentsLoading} />
            <AddComment
              onSubmit={handleAddComment}
              isSubmitting={createCommentMutation.isPending}
            />
          </div>
        </div>

        <div className="card-modal__footer">
          {canEdit && (
            <button
              className="card-modal__btn card-modal__btn--save"
              onClick={handleSave}
              disabled={!title.trim() || updateCardMutation.isPending}
            >
              {updateCardMutation.isPending ? "Saving..." : "Save"}
            </button>
          )}
          {canDelete && (
            <button
              className="card-modal__btn card-modal__btn--delete"
              onClick={handleDelete}
              disabled={deleteCardMutation.isPending}
            >
              {deleteCardMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          )}
          <button
            className="card-modal__btn card-modal__btn--cancel"
            onClick={onClose}
          >
            {canEdit || canDelete ? "Cancel" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
