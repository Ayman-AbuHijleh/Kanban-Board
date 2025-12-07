import React, { useState, lazy, Suspense } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import type { List } from "../../types/list";
import { useUpdateList, useDeleteList } from "../../hooks/useBoardLists";
import { useListCards } from "../../hooks/useCards";
import { useBoardPermissions } from "../../hooks/useBoardPermissions";
import type { Card as CardType } from "../../types/card";
import CreateCardForm from "../CreateCardForm";
import "./ListColumn.scss";

const Card = lazy(() => import("../Card"));
const CardModal = lazy(() => import("../CardModal"));

interface ListColumnProps {
  list: List;
  index: number;
}

const ListColumn: React.FC<ListColumnProps> = ({ list, index }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);

  // Get permissions for the current user
  const { canEdit, canDelete } = useBoardPermissions(list.board_id);

  const updateListMutation = useUpdateList();
  const deleteListMutation = useDeleteList();
  const { data: cards, isLoading: cardsLoading } = useListCards(list.list_id);

  const handleTitleSubmit = () => {
    if (title.trim() && title !== list.title) {
      updateListMutation.mutate({
        listId: list.list_id,
        payload: { title: title.trim() },
      });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTitleSubmit();
    } else if (e.key === "Escape") {
      setTitle(list.title);
      setIsEditingTitle(false);
    }
  };

  const handleDeleteList = () => {
    if (window.confirm(`Delete list "${list.title}"?`)) {
      deleteListMutation.mutate({
        listId: list.list_id,
        boardId: list.board_id,
      });
    }
  };

  return (
    <Draggable
      draggableId={list.list_id}
      index={index}
      isDragDisabled={!canEdit}
    >
      {(provided, snapshot) => (
        <div
          className={`list-column ${
            snapshot.isDragging ? "list-column--dragging" : ""
          }`}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div
            className="list-column__header"
            {...(canEdit ? provided.dragHandleProps : {})}
          >
            {isEditingTitle ? (
              <input
                type="text"
                className="list-column__title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleTitleKeyDown}
                autoFocus
              />
            ) : (
              <h3
                className="list-column__title"
                onClick={() => canEdit && setIsEditingTitle(true)}
                style={{ cursor: canEdit ? "pointer" : "default" }}
              >
                {list.title}
              </h3>
            )}
            {canDelete && (
              <button
                className="list-column__delete-btn"
                onClick={handleDeleteList}
                title="Delete list"
              >
                ×
              </button>
            )}
          </div>
          <Droppable droppableId={list.list_id} type="card">
            {(provided, snapshot) => (
              <div
                className={`list-column__cards ${
                  snapshot.isDraggingOver
                    ? "list-column__cards--dragging-over"
                    : ""
                }`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {cardsLoading ? (
                  <p className="list-column__loading">Loading cards...</p>
                ) : cards && cards.length > 0 ? (
                  <Suspense fallback={<div>Loading...</div>}>
                    {cards.map((card, index) => (
                      <Card
                        key={card.card_id}
                        card={card}
                        index={index}
                        onClick={() => setSelectedCard(card)}
                        canEdit={canEdit}
                      />
                    ))}
                  </Suspense>
                ) : (
                  <p className="list-column__empty">No cards yet</p>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {canEdit && <CreateCardForm listId={list.list_id} />}

          {selectedCard && (
            <Suspense fallback={null}>
              <CardModal
                card={selectedCard}
                boardId={list.board_id}
                isOpen={!!selectedCard}
                onClose={() => setSelectedCard(null)}
              />
            </Suspense>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default ListColumn;
