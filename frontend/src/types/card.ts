import type { CardLabel } from "./label";

export interface CardAssigneeUser {
  user_id: string;
  name: string;
  email: string;
}

export interface CardAssignee {
  id: string;
  card_id: string;
  user_id: string;
  user: CardAssigneeUser;
}

export interface Card {
  card_id: string;
  list_id: string;
  title: string;
  description?: string;
  due_date?: string;
  position: number;
  labels?: CardLabel[];
  assignees?: CardAssignee[];
}

export interface CreateCardPayload {
  title: string;
  description?: string;
  due_date?: string;
}

export interface UpdateCardPayload {
  title?: string;
  description?: string;
  due_date?: string;
  list_id?: string;
  position?: number;
}

export interface CardsResponse {
  message: string;
  data: Card[];
}

export interface CardResponse {
  message: string;
  data: Card;
}

export interface CardAssigneeResponse {
  message: string;
  data: CardAssignee;
}
