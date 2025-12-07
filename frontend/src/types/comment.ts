export interface CommentUser {
  user_id: string;
  name: string;
  email: string;
}

export interface Comment {
  comment_id: string;
  content: string;
  card_id: string;
  user_id: string;
  created_at: string;
  user: CommentUser;
}

export interface CreateCommentPayload {
  content: string;
}

export interface CommentsResponse {
  message: string;
  data: Comment[];
}

export interface CommentResponse {
  message: string;
  data: Comment;
}
