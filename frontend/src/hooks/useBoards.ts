import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as boardService from "../services/boardService";
import type {
  CreateBoardPayload,
  UpdateBoardPayload,
  BoardError,
} from "../types/board";

export const useBoards = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>("");

  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: boardService.getBoards,
    staleTime: 1000 * 60 * 5,
  });

  const createBoardMutation = useMutation({
    mutationFn: (payload: CreateBoardPayload) =>
      boardService.createBoard(payload),
    onSuccess: () => {
      setError("");
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
    onError: (err: any) => {
      const errorData = err.response?.data as BoardError;
      if (errorData?.errors) {
        const firstError = Object.values(errorData.errors)[0];
        setError(
          Array.isArray(firstError) ? firstError[0] : String(firstError)
        );
      } else {
        setError(
          errorData?.message || "Failed to create board. Please try again."
        );
      }
    },
  });

  const updateBoardMutation = useMutation({
    mutationFn: ({
      boardId,
      payload,
    }: {
      boardId: string;
      payload: UpdateBoardPayload;
    }) => boardService.updateBoard(boardId, payload),
    onSuccess: () => {
      setError("");
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
    onError: (err: any) => {
      const errorData = err.response?.data as BoardError;
      if (errorData?.errors) {
        const firstError = Object.values(errorData.errors)[0];
        setError(
          Array.isArray(firstError) ? firstError[0] : String(firstError)
        );
      } else {
        setError(
          errorData?.message || "Failed to update board. Please try again."
        );
      }
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: (boardId: string) => boardService.deleteBoard(boardId),
    onSuccess: () => {
      setError("");
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
    onError: (err: any) => {
      const errorData = err.response?.data as BoardError;
      setError(
        errorData?.message || "Failed to delete board. Please try again."
      );
    },
  });

  return {
    boards: boardsQuery.data || [],
    isLoading: boardsQuery.isLoading,
    isError: boardsQuery.isError,
    refetch: boardsQuery.refetch,

    createBoard: createBoardMutation.mutate,
    isCreating: createBoardMutation.isPending,

    updateBoard: updateBoardMutation.mutate,
    isUpdating: updateBoardMutation.isPending,

    deleteBoard: deleteBoardMutation.mutate,
    isDeleting: deleteBoardMutation.isPending,

    error,
    setError,
  };
};
