import api from "./api";
import type {
  List,
  CreateListPayload,
  UpdateListPayload,
  ListsResponse,
  ListResponse,
} from "../types/list";

export const getLists = async (boardId: string): Promise<List[]> => {
  const response = await api.get<ListsResponse>(`/boards/${boardId}/lists`);
  return response.data.data;
};

export const createList = async (
  boardId: string,
  payload: CreateListPayload
): Promise<List> => {
  const response = await api.post<ListResponse>(
    `/boards/${boardId}/lists`,
    payload
  );
  return response.data.data;
};

export const updateList = async (
  listId: string,
  payload: UpdateListPayload
): Promise<List> => {
  const response = await api.put<ListResponse>(`/lists/${listId}`, payload);
  return response.data.data;
};

export const deleteList = async (listId: string): Promise<void> => {
  await api.delete(`/lists/${listId}`);
};
