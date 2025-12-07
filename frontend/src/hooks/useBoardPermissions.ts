import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBoards } from "../services/boardService";
import { getCurrentUser } from "../services/authService";
import {
  canEdit,
  canDelete,
  canManageMembers,
  canDeleteBoard,
  canView,
  canComment,
  getUserRoleForBoard,
} from "../utils/permissions";

/**
 * Custom hook to get board permissions for the current user
 */
export const useBoardPermissions = (boardId: string | undefined) => {
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.user_id;

  // Fetch boards to get the current board data with members
  const { data: boards } = useQuery({
    queryKey: ["boards"],
    queryFn: getBoards,
    staleTime: 1000 * 60 * 5,
  });

  const board = useMemo(() => {
    return boards?.find((b) => b.board_id === boardId);
  }, [boards, boardId]);

  const permissions = useMemo(() => {
    return {
      canEdit: canEdit(board, currentUserId),
      canDelete: canDelete(board, currentUserId),
      canManageMembers: canManageMembers(board, currentUserId),
      canDeleteBoard: canDeleteBoard(board, currentUserId),
      canView: canView(board, currentUserId),
      canComment: canComment(board, currentUserId),
      role: getUserRoleForBoard(board, currentUserId),
      isOwner: board?.owner_id === currentUserId,
    };
  }, [board, currentUserId]);

  return permissions;
};
