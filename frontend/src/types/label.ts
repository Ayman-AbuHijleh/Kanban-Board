export interface Label {
  label_id: string;
  board_id: string;
  name: string;
  color: string;
}

export interface CardLabel {
  id: string;
  card_id: string;
  label_id: string;
  label: Label;
}

export interface CreateLabelPayload {
  name: string;
  color: string;
}

export interface UpdateLabelPayload {
  name?: string;
  color?: string;
}

export interface LabelsResponse {
  message: string;
  data: Label[];
}

export interface LabelResponse {
  message: string;
  data: Label;
}

export interface CardLabelResponse {
  message: string;
  data: CardLabel;
}

// Predefined Trello-like colors for labels
export const LABEL_COLORS = [
  { name: "Green", value: "#61bd4f" },
  { name: "Yellow", value: "#f2d600" },
  { name: "Orange", value: "#ff9f1a" },
  { name: "Red", value: "#eb5a46" },
  { name: "Purple", value: "#c377e0" },
  { name: "Blue", value: "#0079bf" },
  { name: "Sky", value: "#00c2e0" },
  { name: "Lime", value: "#51e898" },
  { name: "Pink", value: "#ff78cb" },
  { name: "Black", value: "#344563" },
] as const;
