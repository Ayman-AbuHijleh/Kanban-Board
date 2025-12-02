export interface Card {
  card_id: string;
  list_id: string;
  title: string;
  description?: string;
  due_date?: string;
  position: number;
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
