import api from "./api";
import type {
  Card,
  CreateCardPayload,
  UpdateCardPayload,
  CardsResponse,
  CardResponse,
  CardAssignee,
  CardAssigneeResponse,
} from "../types/card";

export const getCards = async (listId: string): Promise<Card[]> => {
  const response = await api.get<CardsResponse>(`/lists/${listId}/cards`);
  return response.data.data;
};

export const createCard = async (
  listId: string,
  payload: CreateCardPayload
): Promise<Card> => {
  const response = await api.post<CardResponse>(
    `/lists/${listId}/cards`,
    payload
  );
  return response.data.data;
};

export const updateCard = async (
  cardId: string,
  payload: UpdateCardPayload
): Promise<Card> => {
  const response = await api.put<CardResponse>(`/cards/${cardId}`, payload);
  return response.data.data;
};

export const deleteCard = async (cardId: string): Promise<void> => {
  await api.delete(`/cards/${cardId}`);
};

export const moveCard = async (
  cardId: string,
  payload: { new_list_id: string; new_position: number }
): Promise<Card> => {
  const response = await api.put<CardResponse>(
    `/cards/${cardId}/move`,
    payload
  );
  return response.data.data;
};

export const assignUserToCard = async (
  cardId: string,
  userId: string
): Promise<CardAssignee> => {
  const response = await api.post<CardAssigneeResponse>(
    `/cards/${cardId}/assign`,
    { user_id: userId }
  );
  return response.data.data;
};

export const unassignUserFromCard = async (
  cardId: string,
  userId: string
): Promise<void> => {
  await api.delete(`/cards/${cardId}/assign/${userId}`);
};
