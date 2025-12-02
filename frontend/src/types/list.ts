export interface List {
  list_id: string;
  board_id: string;
  title: string;
  position: number;
}

export interface CreateListPayload {
  title: string;
}

export interface UpdateListPayload {
  title?: string;
  position?: number;
}

export interface ListsResponse {
  message: string;
  data: List[];
}

export interface ListResponse {
  message: string;
  data: List;
}
