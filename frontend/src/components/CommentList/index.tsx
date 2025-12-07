import React from "react";
import type { Comment } from "../../types/comment";
import "./CommentList.scss";

interface CommentListProps {
  comments: Comment[];
  isLoading?: boolean;
}

const CommentList: React.FC<CommentListProps> = ({ comments, isLoading }) => {
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="comment-list">
        <div className="comment-list__loading">Loading comments...</div>
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="comment-list">
        <div className="comment-list__empty">
          No comments yet. Be the first to comment!
        </div>
      </div>
    );
  }

  return (
    <div className="comment-list">
      {comments.map((comment) => (
        <div key={comment.comment_id} className="comment-list__item">
          <div className="comment-list__avatar">
            {getInitials(comment.user.name)}
          </div>
          <div className="comment-list__content">
            <div className="comment-list__header">
              <span className="comment-list__author">{comment.user.name}</span>
              <span className="comment-list__date">
                {formatDate(comment.created_at)}
              </span>
            </div>
            <div className="comment-list__text">{comment.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentList;
