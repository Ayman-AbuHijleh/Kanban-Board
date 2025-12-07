import type { Board } from "../types/board";

export type BoardRole = "ADMIN" | "EDITOR" | "VIEWER";

/**
 * Get the current user's role for a specific board
 */
export const getUserRoleForBoard = (
  board: Board | null | undefined,
  currentUserId: string | undefined
): BoardRole | null => {
  if (!board || !currentUserId) return null;

  // Owner always has ADMIN role
  if (board.owner_id === currentUserId) {
    return "ADMIN";
  }

  // Find the user in board members
  const member = board.members?.find((m) => m.user_id === currentUserId);
  if (!member) return null;

  // Normalize role to uppercase (backend uses uppercase, but types use lowercase)
  return member.role.toUpperCase() as BoardRole;
};

/**
 * Check if user can edit content (create, update cards/lists/labels)
 * Only ADMIN and EDITOR roles can edit
 */
export const canEdit = (
  board: Board | null | undefined,
  currentUserId: string | undefined
): boolean => {
  const role = getUserRoleForBoard(board, currentUserId);
  return role === "ADMIN" || role === "EDITOR";
};

/**
 * Check if user can delete content (delete cards/lists/labels)
 * Only ADMIN and EDITOR roles can delete
 */
export const canDelete = (
  board: Board | null | undefined,
  currentUserId: string | undefined
): boolean => {
  const role = getUserRoleForBoard(board, currentUserId);
  return role === "ADMIN" || role === "EDITOR";
};

/**
 * Check if user can manage members (invite, change roles, remove)
 * Only ADMIN role can manage members
 */
export const canManageMembers = (
  board: Board | null | undefined,
  currentUserId: string | undefined
): boolean => {
  const role = getUserRoleForBoard(board, currentUserId);
  return role === "ADMIN";
};

/**
 * Check if user can delete the board
 * Only the board owner can delete the board
 */
export const canDeleteBoard = (
  board: Board | null | undefined,
  currentUserId: string | undefined
): boolean => {
  if (!board || !currentUserId) return false;
  return board.owner_id === currentUserId;
};

/**
 * Check if user can view content (read-only access)
 * All roles (ADMIN, EDITOR, VIEWER) can view
 */
export const canView = (
  board: Board | null | undefined,
  currentUserId: string | undefined
): boolean => {
  const role = getUserRoleForBoard(board, currentUserId);
  return role !== null;
};

/**
 * Check if user can comment on cards
 * All roles (ADMIN, EDITOR, VIEWER) can comment
 */
export const canComment = (
  board: Board | null | undefined,
  currentUserId: string | undefined
): boolean => {
  const role = getUserRoleForBoard(board, currentUserId);
  return role !== null;
};
