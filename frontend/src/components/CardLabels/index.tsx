import React from "react";
import type { CardLabel } from "../../types/label";
import "./CardLabels.scss";

interface CardLabelsProps {
  labels?: CardLabel[];
  compact?: boolean;
}

const CardLabels: React.FC<CardLabelsProps> = ({ labels, compact = false }) => {
  if (!labels || labels.length === 0) {
    return null;
  }

  return (
    <div className={`card-labels ${compact ? "card-labels--compact" : ""}`}>
      {labels.map((cardLabel) => (
        <div
          key={cardLabel.id}
          className="card-labels__label"
          style={{ backgroundColor: cardLabel.label.color }}
          title={cardLabel.label.name}
        >
          {!compact && (
            <span className="card-labels__name">{cardLabel.label.name}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CardLabels;
