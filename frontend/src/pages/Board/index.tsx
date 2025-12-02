import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { useBoardLists } from "../../hooks/useBoardLists";
import { useMoveCard } from "../../hooks/useCards";
import ListColumn from "../../components/ListColumn";
import AddListButton from "../../components/AddListButton";
import "./Board.scss";

const Board: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const { data: lists, isLoading, error } = useBoardLists(boardId || "");
  const moveCardMutation = useMoveCard();

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // No destination - dropped outside
    if (!destination) {
      return;
    }

    // Dropped in same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Move the card
    moveCardMutation.mutate({
      cardId: draggableId,
      newListId: destination.droppableId,
      newPosition: destination.index,
      sourceListId: source.droppableId,
    });
  };

  if (!boardId) {
    navigate("/dashboard");
    return null;
  }

  if (isLoading) {
    return <div className="board__loading">Loading board...</div>;
  }

  if (error) {
    return (
      <div className="board__error">Error loading board: {error.message}</div>
    );
  }

  return (
    <div className="board">
      <div className="board__header">
        <h1 className="board__title">Board</h1>
        <button
          className="board__back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board__lists-container">
          <div className="board__lists">
            {lists?.map((list) => (
              <ListColumn key={list.list_id} list={list} />
            ))}
            <AddListButton boardId={boardId} />
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default Board;
