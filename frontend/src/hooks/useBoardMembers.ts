import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as boardService from "../services/boardService";
import type {
  BoardMember,
  InviteMemberPayload,
  UpdateRolePayload,
  BoardError,
  User,
} from "../types/board";

export const useBoardMembers = (boardId: string) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>("");

  const membersQuery = useQuery({
    queryKey: ["boardMembers", boardId],
    queryFn: () => boardService.getBoardMembers(boardId),
    enabled: !!boardId,
    staleTime: 1000 * 60 * 5,
  });

  const inviteMemberMutation = useMutation({
    mutationFn: (payload: InviteMemberPayload) =>
      boardService.inviteMember(boardId, payload),
    onSuccess: () => {
      setError("");
      queryClient.invalidateQueries({ queryKey: ["boardMembers", boardId] });
    },
    onError: (err: any) => {
      const errorData = err.response?.data as BoardError;
      setError(
        errorData?.message || "Failed to invite member. Please try again."
      );
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UpdateRolePayload;
    }) => boardService.updateMemberRole(boardId, userId, payload),
    onSuccess: () => {
      setError("");
      queryClient.invalidateQueries({ queryKey: ["boardMembers", boardId] });
    },
    onError: (err: any) => {
      const errorData = err.response?.data as BoardError;
      setError(
        errorData?.message || "Failed to update member role. Please try again."
      );
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => boardService.removeMember(boardId, userId),
    onSuccess: () => {
      setError("");
      queryClient.invalidateQueries({ queryKey: ["boardMembers", boardId] });
    },
    onError: (err: any) => {
      const errorData = err.response?.data as BoardError;
      setError(
        errorData?.message || "Failed to remove member. Please try again."
      );
    },
  });

  return {
    owner: membersQuery.data?.owner as User | undefined,
    members: membersQuery.data?.members || ([] as BoardMember[]),
    isLoading: membersQuery.isLoading,
    isError: membersQuery.isError,
    refetch: membersQuery.refetch,

    inviteMember: inviteMemberMutation.mutate,
    isInviting: inviteMemberMutation.isPending,

    updateRole: updateRoleMutation.mutate,
    isUpdatingRole: updateRoleMutation.isPending,

    removeMember: removeMemberMutation.mutate,
    isRemovingMember: removeMemberMutation.isPending,

    error,
    setError,
  };
};
