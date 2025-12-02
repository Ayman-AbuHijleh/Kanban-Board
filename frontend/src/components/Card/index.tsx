import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import type { Card as CardType } from "../../types/card";
import "./Card.scss";

interface CardProps {
  card: CardType;
  onClick: () => void;
  index: number;
}

const Card: React.FC<CardProps> = ({ card, onClick, index }) => {
  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const isDueSoon = (dateString?: string) => {
    if (!dateString) return false;
    const dueDate = new Date(dateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2 && diffDays >= 0;
  };

  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    const dueDate = new Date(dateString);
    const today = new Date();
    return dueDate < today;
  };

  return (
    <Draggable draggableId={card.card_id} index={index}>
      {(provided, snapshot) => (
        <div
          className={`card ${snapshot.isDragging ? "card--dragging" : ""}`}
          onClick={onClick}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <h4 className="card__title">{card.title}</h4>
          {card.description && (
            <p className="card__description">{card.description}</p>
          )}
          {card.due_date && (
            <div
              className={`card__due-date ${
                isOverdue(card.due_date)
                  ? "card__due-date--overdue"
                  : isDueSoon(card.due_date)
                  ? "card__due-date--soon"
                  : ""
              }`}
            >
              📅 {formatDueDate(card.due_date)}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default Card;
