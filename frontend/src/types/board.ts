export interface User {
  user_id: string;
  name: string;
  email: string;
}

export interface BoardMember {
  member_id: string;
  user_id: string;
  role: "admin" | "editor" | "viewer";
  user: User;
}

export interface Board {
  board_id: string;
  name: string;
  owner_id: string;
  owner: User;
  members: BoardMember[];
}

export interface CreateBoardPayload {
  name: string;
}

export interface UpdateBoardPayload {
  name: string;
}

export interface GetBoardsResponse {
  message: string;
  boards: Board[];
}

export interface BoardResponse {
  message: string;
  board: Board;
}

export interface DeleteBoardResponse {
  message: string;
}

export interface BoardError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface InviteMemberPayload {
  email: string;
}

export interface UpdateRolePayload {
  role: "admin" | "editor" | "viewer";
}

export interface InviteMemberResponse {
  message: string;
  member: BoardMember;
}

export interface GetBoardMembersResponse {
  message: string;
  owner: User;
  members: BoardMember[];
}

export interface UpdateMemberRoleResponse {
  message: string;
  member: BoardMember;
}
