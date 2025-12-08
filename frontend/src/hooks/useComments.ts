import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCardComments,
  createComment,
  deleteComment,
} from "../services/commentService";
import type { CreateCommentPayload, Comment } from "../types/comment";

export const useCardComments = (cardId: string) => {
  return useQuery({
    queryKey: ["comments", cardId],
    queryFn: async () => {
      console.log("Fetching comments for card:", cardId);
      const comments = await getCardComments(cardId);
      console.log("Fetched comments:", comments);
      return comments;
    },
    enabled: !!cardId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      payload,
    }: {
      cardId: string;
      payload: CreateCommentPayload;
    }) => {
      console.log("Creating comment:", { cardId, payload });
      return createComment(cardId, payload);
    },
    onMutate: async (variables) => {
      console.log("onMutate triggered with:", variables);
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["comments", variables.cardId],
      });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData<Comment[]>([
        "comments",
        variables.cardId,
      ]);

      console.log("Previous comments:", previousComments);

      // Optimistically update with a temporary comment
      if (previousComments) {
        const tempComment: Comment = {
          comment_id: `temp-${Date.now()}`,
          content: variables.payload.content,
          card_id: variables.cardId,
          user_id: "current-user",
          created_at: new Date().toISOString(),
          user: {
            user_id: "current-user",
            name: "You",
            email: "",
          },
        };

        const newComments = [...previousComments, tempComment];
        console.log("Setting optimistic comments:", newComments);
        queryClient.setQueryData(["comments", variables.cardId], newComments);
      }

      return { previousComments };
    },
    onSuccess: (data, variables) => {
      console.log("Comment created successfully:", data);
      // Refetch to get the real comment with server-generated data
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.cardId],
      });
    },
    onError: (error: any, variables, context) => {
      console.error("Error creating comment:", error);
      // Rollback to previous state on error
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["comments", variables.cardId],
          context.previousComments
        );
      }
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      commentId,
    }: {
      cardId: string;
      commentId: string;
    }) => {
      console.log("Deleting comment:", { cardId, commentId });
      return deleteComment(cardId, commentId);
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["comments", variables.cardId],
      });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData<Comment[]>([
        "comments",
        variables.cardId,
      ]);

      // Optimistically remove the comment
      if (previousComments) {
        const newComments = previousComments.filter(
          (comment) => comment.comment_id !== variables.commentId
        );
        queryClient.setQueryData(["comments", variables.cardId], newComments);
      }

      return { previousComments };
    },
    onSuccess: (_data, variables) => {
      console.log("Comment deleted successfully");
      // Refetch to sync with server
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.cardId],
      });
    },
    onError: (error: any, variables, context) => {
      console.error("Error deleting comment:", error);
      // Rollback to previous state on error
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["comments", variables.cardId],
          context.previousComments
        );
      }
    },
  });
};
