export const ALL_TYPES = [
  "dae",
  "police",
  "gendarmerie",
  "urgences",
  "hopital",
  "angela",
];

export const DEFAULT_TYPES = [
  "police",
  "gendarmerie",
  "urgences",
  "hopital",
  "angela",
];

export const TYPE_COLORS = {
  dae: "#E91E63",
  police: "#2196F3",
  gendarmerie: "#1565C0",
  urgences: "#F44336",
  hopital: "#FF9800",
  angela: "#9C27B0",
};

export const TYPE_ICONS = {
  dae: "heart-pulse",
  police: "shield-account",
  gendarmerie: "shield-account",
  urgences: "hospital-box",
  hopital: "hospital-building",
  angela: "shield-home",
};

export const STATUS_COLORS = {
  open: "#4CAF50",
  closed: "#F44336",
  unknown: "#9E9E9E",
};

export const TYPE_I18N_KEYS = {
  dae: "placeTypeDae",
  police: "placeTypePolice",
  gendarmerie: "placeTypeGendarmerie",
  urgences: "placeTypeUrgences",
  hopital: "placeTypeHopital",
  angela: "placeTypeAngela",
};

export function formatDistance(meters) {
  if (meters == null) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
