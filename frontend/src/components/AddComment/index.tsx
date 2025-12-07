import React, { useState } from "react";
import "./AddComment.scss";

interface AddCommentProps {
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
}

const AddComment: React.FC<AddCommentProps> = ({ onSubmit, isSubmitting }) => {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    onSubmit(content.trim());
    setContent("");
  };

  return (
    <form className="add-comment" onSubmit={handleSubmit}>
      <textarea
        className="add-comment__textarea"
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        disabled={isSubmitting}
      />
      <div className="add-comment__actions">
        <button
          type="submit"
          className="add-comment__submit"
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? "Posting..." : "Post Comment"}
        </button>
      </div>
    </form>
  );
};

export default AddComment;
