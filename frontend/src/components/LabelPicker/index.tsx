import React, { useState } from "react";
import {
  useBoardLabels,
  useCreateLabel,
  useDeleteLabel,
} from "../../hooks/useLabels";
import { LABEL_COLORS } from "../../types/label";
import type { Label } from "../../types/label";
import "./LabelPicker.scss";

interface LabelPickerProps {
  boardId: string;
  selectedLabelIds: string[];
  onLabelToggle: (labelId: string) => void;
}

const LabelPicker: React.FC<LabelPickerProps> = ({
  boardId,
  selectedLabelIds,
  onLabelToggle,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(
    LABEL_COLORS[0].value
  );

  const { data: labels, isLoading } = useBoardLabels(boardId);
  const createLabelMutation = useCreateLabel();
  const deleteLabelMutation = useDeleteLabel();

  const handleCreateLabel = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newLabelName.trim()) return;

    createLabelMutation.mutate(
      {
        boardId,
        payload: {
          name: newLabelName.trim(),
          color: selectedColor,
        },
      },
      {
        onSuccess: () => {
          setNewLabelName("");
          setSelectedColor(LABEL_COLORS[0].value);
          setIsCreating(false);
        },
      }
    );
  };

  const handleDeleteLabel = (labelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this label?")) {
      deleteLabelMutation.mutate({ labelId, boardId });
    }
  };

  const isLabelSelected = (labelId: string) => {
    return selectedLabelIds.includes(labelId);
  };

  if (isLoading) {
    return <div className="label-picker__loading">Loading labels...</div>;
  }

  return (
    <div className="label-picker">
      <h4 className="label-picker__title">Labels</h4>

      <div className="label-picker__list">
        {labels?.map((label: Label) => (
          <div
            key={label.label_id}
            className={`label-picker__item ${
              isLabelSelected(label.label_id)
                ? "label-picker__item--selected"
                : ""
            }`}
            onClick={() => onLabelToggle(label.label_id)}
          >
            <div
              className="label-picker__color"
              style={{ backgroundColor: label.color }}
            />
            <span className="label-picker__name">{label.name}</span>
            {isLabelSelected(label.label_id) && (
              <span className="label-picker__check">✓</span>
            )}
            <button
              className="label-picker__delete"
              onClick={(e) => handleDeleteLabel(label.label_id, e)}
              title="Delete label"
            >
              ×
            </button>
          </div>
        ))}

        {labels?.length === 0 && !isCreating && (
          <p className="label-picker__empty">No labels yet</p>
        )}
      </div>

      {isCreating ? (
        <form className="label-picker__form" onSubmit={handleCreateLabel}>
          <input
            type="text"
            className="label-picker__input"
            placeholder="Label name"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            autoFocus
          />

          <div className="label-picker__colors">
            {LABEL_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                className={`label-picker__color-btn ${
                  selectedColor === color.value
                    ? "label-picker__color-btn--selected"
                    : ""
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => setSelectedColor(color.value)}
                title={color.name}
              />
            ))}
          </div>

          <div className="label-picker__actions">
            <button
              type="submit"
              className="label-picker__btn label-picker__btn--primary"
              disabled={!newLabelName.trim() || createLabelMutation.isPending}
            >
              {createLabelMutation.isPending ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              className="label-picker__btn label-picker__btn--secondary"
              onClick={() => {
                setIsCreating(false);
                setNewLabelName("");
                setSelectedColor(LABEL_COLORS[0].value);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          className="label-picker__add-btn"
          onClick={() => setIsCreating(true)}
        >
          + Create new label
        </button>
      )}
    </div>
  );
};

export default LabelPicker;
