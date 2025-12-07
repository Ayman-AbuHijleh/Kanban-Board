import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBoardLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  addLabelToCard,
  removeLabelFromCard,
} from "../services/labelService";
import type { CreateLabelPayload, UpdateLabelPayload } from "../types/label";

export const useBoardLabels = (boardId: string) => {
  return useQuery({
    queryKey: ["labels", boardId],
    queryFn: () => getBoardLabels(boardId),
    enabled: !!boardId,
  });
};

export const useCreateLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      payload,
    }: {
      boardId: string;
      payload: CreateLabelPayload;
    }) => createLabel(boardId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["labels", variables.boardId],
      });
    },
  });
};

export const useUpdateLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      labelId,
      payload,
    }: {
      labelId: string;
      payload: UpdateLabelPayload;
      boardId: string;
    }) => updateLabel(labelId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["labels", variables.boardId],
      });
    },
  });
};

export const useDeleteLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ labelId }: { labelId: string; boardId: string }) =>
      deleteLabel(labelId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["labels", variables.boardId],
      });
      // Also invalidate cards that might have this label
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
};

export const useAddLabelToCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      labelId,
    }: {
      cardId: string;
      labelId: string;
      listId: string;
    }) => addLabelToCard(cardId, labelId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cards", variables.listId] });
    },
  });
};

export const useRemoveLabelFromCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      labelId,
    }: {
      cardId: string;
      labelId: string;
      listId: string;
    }) => removeLabelFromCard(cardId, labelId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cards", variables.listId] });
    },
  });
};
