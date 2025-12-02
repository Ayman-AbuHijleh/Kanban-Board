import api from "./api";
import type {
  Board,
  BoardMember,
  CreateBoardPayload,
  UpdateBoardPayload,
  GetBoardsResponse,
  BoardResponse,
  DeleteBoardResponse,
  InviteMemberPayload,
  GetBoardMembersResponse,
  UpdateRolePayload,
  InviteMemberResponse,
  UpdateMemberRoleResponse,
} from "../types/board";

export const getBoards = async (): Promise<Board[]> => {
  const response = await api.get<GetBoardsResponse>("/boards");
  return response.data.boards;
};

export const createBoard = async (
  payload: CreateBoardPayload
): Promise<Board> => {
  const response = await api.post<BoardResponse>("/boards", payload);
  return response.data.board;
};

export const updateBoard = async (
  boardId: string,
  payload: UpdateBoardPayload
): Promise<Board> => {
  const response = await api.put<BoardResponse>(`/boards/${boardId}`, payload);
  return response.data.board;
};

export const deleteBoard = async (boardId: string): Promise<void> => {
  await api.delete<DeleteBoardResponse>(`/boards/${boardId}`);
};

export const inviteMember = async (
  boardId: string,
  payload: InviteMemberPayload
): Promise<BoardMember> => {
  const response = await api.post<InviteMemberResponse>(
    `/boards/${boardId}/invite`,
    payload
  );
  return response.data.member;
};

export const getBoardMembers = async (
  boardId: string
): Promise<GetBoardMembersResponse> => {
  const response = await api.get<GetBoardMembersResponse>(
    `/boards/${boardId}/members`
  );
  return response.data;
};

export const updateMemberRole = async (
  boardId: string,
  userId: string,
  payload: UpdateRolePayload
): Promise<BoardMember> => {
  const response = await api.put<UpdateMemberRoleResponse>(
    `/boards/${boardId}/members/${userId}/role`,
    payload
  );
  return response.data.member;
};
