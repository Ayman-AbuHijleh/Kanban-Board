import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLists,
  createList,
  updateList,
  deleteList,
} from "../services/listService";
import type { CreateListPayload, UpdateListPayload } from "../types/list";

export const useBoardLists = (boardId: string) => {
  return useQuery({
    queryKey: ["lists", boardId],
    queryFn: () => getLists(boardId),
    enabled: !!boardId,
  });
};

export const useCreateList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      payload,
    }: {
      boardId: string;
      payload: CreateListPayload;
    }) => createList(boardId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lists", variables.boardId] });
    },
  });
};

export const useUpdateList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listId,
      payload,
    }: {
      listId: string;
      payload: UpdateListPayload;
    }) => updateList(listId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lists", data.board_id] });
    },
  });
};

export const useDeleteList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId }: { listId: string; boardId: string }) =>
      deleteList(listId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lists", variables.boardId] });
    },
  });
};
