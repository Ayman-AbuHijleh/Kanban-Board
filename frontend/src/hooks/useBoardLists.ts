import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLists,
  createList,
  updateList,
  deleteList,
  moveList,
} from "../services/listService";
import type { CreateListPayload, UpdateListPayload, List } from "../types/list";

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

export const useMoveList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listId,
      newPosition,
    }: {
      listId: string;
      newPosition: number;
      boardId: string;
    }) =>
      moveList(listId, {
        new_position: newPosition,
      }),
    onMutate: async ({ listId, newPosition, boardId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["lists", boardId] });

      // Snapshot previous value
      const previousLists = queryClient.getQueryData<List[]>([
        "lists",
        boardId,
      ]);

      // Optimistically update
      if (previousLists) {
        const listToMove = previousLists.find((l) => l.list_id === listId);

        if (listToMove) {
          const updatedLists = [...previousLists];
          const oldPosition = listToMove.position;

          // Remove list from old position
          const listIndex = updatedLists.findIndex((l) => l.list_id === listId);
          updatedLists.splice(listIndex, 1);

          // Insert at new position
          updatedLists.splice(newPosition, 0, {
            ...listToMove,
            position: newPosition,
          });

          // Update positions
          const reorderedLists = updatedLists.map((list, index) => ({
            ...list,
            position: index,
          }));

          queryClient.setQueryData(["lists", boardId], reorderedLists);
        }
      }

      return { previousLists, boardId };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousLists) {
        queryClient.setQueryData(
          ["lists", context.boardId],
          context.previousLists
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["lists", variables.boardId] });
    },
  });
};
