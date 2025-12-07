import api from "./api";
import type {
  Comment,
  CreateCommentPayload,
  CommentsResponse,
  CommentResponse,
} from "../types/comment";

export const getCardComments = async (cardId: string): Promise<Comment[]> => {
  const response = await api.get<CommentsResponse>(`/cards/${cardId}/comments`);
  return response.data.data;
};

export const createComment = async (
  cardId: string,
  payload: CreateCommentPayload
): Promise<Comment> => {
  const response = await api.post<CommentResponse>(
    `/cards/${cardId}/comments`,
    payload
  );
  return response.data.data;
};
