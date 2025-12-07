import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCards,
  createCard,
  updateCard,
  deleteCard,
  moveCard,
  assignUserToCard,
  unassignUserFromCard,
} from "../services/cardService";
import type { CreateCardPayload, UpdateCardPayload, Card } from "../types/card";

export const useListCards = (listId: string) => {
  return useQuery({
    queryKey: ["cards", listId],
    queryFn: () => getCards(listId),
    enabled: !!listId,
  });
};

export const useCreateCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listId,
      payload,
    }: {
      listId: string;
      payload: CreateCardPayload;
    }) => createCard(listId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cards", variables.listId] });
    },
  });
};

export const useUpdateCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      payload,
    }: {
      cardId: string;
      payload: UpdateCardPayload;
    }) => updateCard(cardId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cards", data.list_id] });
    },
  });
};

export const useDeleteCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId }: { cardId: string; listId: string }) =>
      deleteCard(cardId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cards", variables.listId] });
    },
  });
};

export const useMoveCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      newListId,
      newPosition,
    }: {
      cardId: string;
      newListId: string;
      newPosition: number;
      sourceListId: string;
    }) =>
      moveCard(cardId, {
        new_list_id: newListId,
        new_position: newPosition,
      }),
    onMutate: async ({ cardId, newListId, newPosition, sourceListId }) => {
      await queryClient.cancelQueries({ queryKey: ["cards", sourceListId] });
      await queryClient.cancelQueries({ queryKey: ["cards", newListId] });

      const previousSourceCards = queryClient.getQueryData<Card[]>([
        "cards",
        sourceListId,
      ]);
      const previousTargetCards =
        sourceListId !== newListId
          ? queryClient.getQueryData<Card[]>(["cards", newListId])
          : null;

      if (previousSourceCards) {
        const cardToMove = previousSourceCards.find(
          (c) => c.card_id === cardId
        );

        if (cardToMove) {
          if (sourceListId === newListId) {
            const updatedCards = [...previousSourceCards];

            const cardIndex = updatedCards.findIndex(
              (c) => c.card_id === cardId
            );
            updatedCards.splice(cardIndex, 1);

            updatedCards.splice(newPosition, 0, {
              ...cardToMove,
              position: newPosition,
            });

            const reorderedCards = updatedCards.map((card, index) => ({
              ...card,
              position: index,
            }));

            queryClient.setQueryData(["cards", sourceListId], reorderedCards);
          } else {
            const sourceCards = previousSourceCards
              .filter((c) => c.card_id !== cardId)
              .map((card, index) => ({ ...card, position: index }));

            queryClient.setQueryData(["cards", sourceListId], sourceCards);

            if (previousTargetCards) {
              const targetCards = [...previousTargetCards];
              targetCards.splice(newPosition, 0, {
                ...cardToMove,
                list_id: newListId,
                position: newPosition,
              });

              const reorderedTargetCards = targetCards.map((card, index) => ({
                ...card,
                position: index,
              }));

              queryClient.setQueryData(
                ["cards", newListId],
                reorderedTargetCards
              );
            }
          }
        }
      }

      return {
        previousSourceCards,
        previousTargetCards,
        sourceListId,
        newListId,
      };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSourceCards) {
        queryClient.setQueryData(
          ["cards", context.sourceListId],
          context.previousSourceCards
        );
      }
      if (
        context?.previousTargetCards &&
        context.newListId !== context.sourceListId
      ) {
        queryClient.setQueryData(
          ["cards", context.newListId],
          context.previousTargetCards
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["cards", variables.sourceListId],
      });
      if (variables.newListId !== variables.sourceListId) {
        queryClient.invalidateQueries({
          queryKey: ["cards", variables.newListId],
        });
      }
    },
  });
};

export const useAssignUserToCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      userId,
    }: {
      cardId: string;
      userId: string;
      listId: string;
      userName: string;
      userEmail: string;
    }) => assignUserToCard(cardId, userId),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: ["cards", variables.listId],
      });

      // Snapshot the previous value
      const previousCards = queryClient.getQueryData<Card[]>([
        "cards",
        variables.listId,
      ]);

      // Optimistically update the card
      if (previousCards) {
        const updatedCards = previousCards.map((card) => {
          if (card.card_id === variables.cardId) {
            const newAssignee = {
              id: `temp-${Date.now()}`, // Temporary ID
              card_id: variables.cardId,
              user_id: variables.userId,
              user: {
                user_id: variables.userId,
                name: variables.userName,
                email: variables.userEmail,
              },
            };
            return {
              ...card,
              assignees: [...(card.assignees || []), newAssignee],
            };
          }
          return card;
        });
        queryClient.setQueryData(["cards", variables.listId], updatedCards);
      }

      return { previousCards };
    },
    onSuccess: (_, variables) => {
      // Refetch to get the real assignment ID from server
      queryClient.invalidateQueries({ queryKey: ["cards", variables.listId] });
    },
    onError: (error, variables, context) => {
      console.error("[useAssignUserToCard] Error:", error);
      // Rollback to previous state on error
      if (context?.previousCards) {
        queryClient.setQueryData(
          ["cards", variables.listId],
          context.previousCards
        );
      }
    },
  });
};

export const useUnassignUserFromCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      userId,
    }: {
      cardId: string;
      userId: string;
      listId: string;
    }) => unassignUserFromCard(cardId, userId),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["cards", variables.listId],
      });

      // Snapshot the previous value
      const previousCards = queryClient.getQueryData<Card[]>([
        "cards",
        variables.listId,
      ]);

      // Optimistically update the card
      if (previousCards) {
        const updatedCards = previousCards.map((card) => {
          if (card.card_id === variables.cardId) {
            return {
              ...card,
              assignees: (card.assignees || []).filter(
                (assignee) => assignee.user_id !== variables.userId
              ),
            };
          }
          return card;
        });
        queryClient.setQueryData(["cards", variables.listId], updatedCards);
      }

      return { previousCards };
    },
    onSuccess: (_, variables) => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ["cards", variables.listId] });
    },
    onError: (error, variables, context) => {
      console.error("[useUnassignUserFromCard] Error:", error);
      // Rollback to previous state on error
      if (context?.previousCards) {
        queryClient.setQueryData(
          ["cards", variables.listId],
          context.previousCards
        );
      }
    },
  });
};
