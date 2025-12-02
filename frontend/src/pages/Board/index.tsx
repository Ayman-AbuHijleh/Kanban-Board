import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBoardLists } from "../../hooks/useBoardLists";
import ListColumn from "../../components/ListColumn";
import AddListButton from "../../components/AddListButton";
import "./Board.scss";

const Board: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const { data: lists, isLoading, error } = useBoardLists(boardId || "");

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
      <div className="board__lists-container">
        <div className="board__lists">
          {lists?.map((list) => (
            <ListColumn key={list.list_id} list={list} />
          ))}
          <AddListButton boardId={boardId} />
        </div>
      </div>
    </div>
  );
};

export default Board;
