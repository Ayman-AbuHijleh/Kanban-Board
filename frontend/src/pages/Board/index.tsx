import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { useBoardLists, useMoveList } from "../../hooks/useBoardLists";
import { useMoveCard } from "../../hooks/useCards";
import { useBoardPermissions } from "../../hooks/useBoardPermissions";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useQueryClient } from "@tanstack/react-query";
import ListColumn from "../../components/ListColumn";
import AddListButton from "../../components/AddListButton";
import "./Board.scss";

const Board: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: lists, isLoading, error } = useBoardLists(boardId || "");
  const moveCardMutation = useMoveCard();
  const moveListMutation = useMoveList();

  // Get permissions for the current user
  const { canEdit, role } = useBoardPermissions(boardId);

  // Connect to WebSocket
  const ws = useWebSocket(boardId);

  // Set up WebSocket event listeners
  useEffect(() => {
    if (!boardId) return;

    // Card events
    const unsubCardCreated = ws.on("card:created", (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["cards", data.list_id] });
    });

    const unsubCardUpdated = ws.on("card:updated", (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["cards", data.card.list_id] });
      if (data.old_list_id && data.old_list_id !== data.card.list_id) {
        queryClient.invalidateQueries({
          queryKey: ["cards", data.old_list_id],
        });
      }
    });

    const unsubCardDeleted = ws.on("card:deleted", (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["cards", data.list_id] });
    });

    const unsubCardMoved = ws.on("card:moved", (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["cards", data.new_list_id] });
      if (data.old_list_id !== data.new_list_id) {
        queryClient.invalidateQueries({
          queryKey: ["cards", data.old_list_id],
        });
      }
    });

    const unsubAssigneeAdded = ws.on("card:assignee_added", (_data: any) => {
      // Find which list contains this card and invalidate it
      lists?.forEach((list) => {
        queryClient.invalidateQueries({ queryKey: ["cards", list.list_id] });
      });
    });

    const unsubAssigneeRemoved = ws.on(
      "card:assignee_removed",
      (_data: any) => {
        lists?.forEach((list) => {
          queryClient.invalidateQueries({ queryKey: ["cards", list.list_id] });
        });
      }
    );

    const unsubLabelAdded = ws.on("card:label_added", (_data: any) => {
      lists?.forEach((list) => {
        queryClient.invalidateQueries({ queryKey: ["cards", list.list_id] });
      });
    });

    const unsubLabelRemoved = ws.on("card:label_removed", (_data: any) => {
      lists?.forEach((list) => {
        queryClient.invalidateQueries({ queryKey: ["cards", list.list_id] });
      });
    });

    // List events
    const unsubListCreated = ws.on("list:created", () => {
      queryClient.invalidateQueries({ queryKey: ["lists", boardId] });
    });

    const unsubListUpdated = ws.on("list:updated", () => {
      queryClient.invalidateQueries({ queryKey: ["lists", boardId] });
    });

    const unsubListDeleted = ws.on("list:deleted", () => {
      queryClient.invalidateQueries({ queryKey: ["lists", boardId] });
    });

    const unsubListMoved = ws.on("list:moved", () => {
      queryClient.invalidateQueries({ queryKey: ["lists", boardId] });
    });

    // Board events
    const unsubBoardUpdated = ws.on("board:updated", () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    });

    const unsubMemberAdded = ws.on("board:member_added", () => {
      queryClient.invalidateQueries({ queryKey: ["boardMembers", boardId] });
    });

    const unsubMemberRemoved = ws.on("board:member_removed", () => {
      queryClient.invalidateQueries({ queryKey: ["boardMembers", boardId] });
    });

    const unsubMemberRoleUpdated = ws.on("board:member_role_updated", () => {
      queryClient.invalidateQueries({ queryKey: ["boardMembers", boardId] });
    });

    // Comment events
    const unsubCommentCreated = ws.on("comment:created", (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["comments", data.card_id] });
    });

    const unsubCommentDeleted = ws.on("comment:deleted", (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["comments", data.card_id] });
    });

    // Cleanup
    return () => {
      unsubCardCreated();
      unsubCardUpdated();
      unsubCardDeleted();
      unsubCardMoved();
      unsubAssigneeAdded();
      unsubAssigneeRemoved();
      unsubLabelAdded();
      unsubLabelRemoved();
      unsubListCreated();
      unsubListUpdated();
      unsubListDeleted();
      unsubListMoved();
      unsubBoardUpdated();
      unsubMemberAdded();
      unsubMemberRemoved();
      unsubMemberRoleUpdated();
      unsubCommentCreated();
      unsubCommentDeleted();
    };
  }, [boardId, ws, queryClient, lists]);

  const handleDragEnd = (result: DropResult) => {
    // Prevent drag and drop if user doesn't have edit permissions
    if (!canEdit) {
      return;
    }

    const { destination, source, draggableId, type } = result;

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

    // Handle list drag
    if (type === "list") {
      moveListMutation.mutate({
        listId: draggableId,
        newPosition: destination.index,
        boardId: boardId || "",
      });
      return;
    }

    // Handle card drag
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
        <h1 className="board__title">
          Board {role && <span className="board__role">({role})</span>}
        </h1>
        <button
          className="board__back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="list" direction="horizontal">
          {(provided) => (
            <div className="board__lists-container">
              <div
                className="board__lists"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {lists?.map((list, index) => (
                  <ListColumn key={list.list_id} list={list} index={index} />
                ))}
                {provided.placeholder}
                <AddListButton boardId={boardId} />
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Board;
