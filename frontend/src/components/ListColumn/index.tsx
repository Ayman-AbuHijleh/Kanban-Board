import React, { useState } from "react";
import type { List } from "../../types/list";
import { useUpdateList, useDeleteList } from "../../hooks/useBoardLists";
import "./ListColumn.scss";

interface ListColumnProps {
  list: List;
}

const ListColumn: React.FC<ListColumnProps> = ({ list }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);

  const updateListMutation = useUpdateList();
  const deleteListMutation = useDeleteList();

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
    <div className="list-column">
      <div className="list-column__header">
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
            onClick={() => setIsEditingTitle(true)}
          >
            {list.title}
          </h3>
        )}
        <button
          className="list-column__delete-btn"
          onClick={handleDeleteList}
          title="Delete list"
        >
          ×
        </button>
      </div>
      <div className="list-column__cards">
        {/* Cards will be added in STEP 5 */}
        <p className="list-column__empty">No cards yet</p>
      </div>
    </div>
  );
};

export default ListColumn;
