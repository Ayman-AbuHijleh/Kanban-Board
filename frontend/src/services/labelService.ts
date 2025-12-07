import api from "./api";
import type {
  Label,
  CreateLabelPayload,
  UpdateLabelPayload,
  LabelsResponse,
  LabelResponse,
  CardLabel,
  CardLabelResponse,
} from "../types/label";

export const getBoardLabels = async (boardId: string): Promise<Label[]> => {
  const response = await api.get<LabelsResponse>(`/boards/${boardId}/labels`);
  return response.data.data;
};

export const createLabel = async (
  boardId: string,
  payload: CreateLabelPayload
): Promise<Label> => {
  const response = await api.post<LabelResponse>(
    `/boards/${boardId}/labels`,
    payload
  );
  return response.data.data;
};

export const updateLabel = async (
  labelId: string,
  payload: UpdateLabelPayload
): Promise<Label> => {
  const response = await api.put<LabelResponse>(`/labels/${labelId}`, payload);
  return response.data.data;
};

export const deleteLabel = async (labelId: string): Promise<void> => {
  await api.delete(`/labels/${labelId}`);
};

export const addLabelToCard = async (
  cardId: string,
  labelId: string
): Promise<CardLabel> => {
  const response = await api.post<CardLabelResponse>(
    `/cards/${cardId}/labels/${labelId}`
  );
  return response.data.data;
};

export const removeLabelFromCard = async (
  cardId: string,
  labelId: string
): Promise<void> => {
  await api.delete(`/cards/${cardId}/labels/${labelId}`);
};
