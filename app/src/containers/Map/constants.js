import humanizeDistance from "~/lib/geo/humanizeDistance";
import { supportEmail } from "~/misc/emails";
import { MAX_BASEUSER_DEVICE_TRACKING } from "~/misc/devicePrefs";

export { MAPS_MAX_ZOOM_LEVEL, MAPS_MIN_ZOOM_LEVEL } from "~/misc/maps";

export { MAX_BASEUSER_DEVICE_TRACKING } from "~/misc/devicePrefs";

export const ZOOM_DURATION = 100;
// export const ANIMATION_DURATION = 150;
export const ANIMATION_DURATION = 1500;
export const ANIMATION_MODE = "fly"; // camera easing, one of: linear, ease, fly
// export  const CLUSTER_MIN_ZOOM_LEVEL = 6;
export const CLUSTER_MIN_ZOOM_LEVEL = 0;
export const DEFAULT_ZOOM_LEVEL = 16;

// loaded from "glyphs" template url defined in style.json
// see also https://github.com/openmaptiles/fonts#supported-font-families
export const textFont = ["Noto Sans Regular"];

export const BoundType = {
  TRACK_ALERT_RADIUS_ALL: "all",
  TRACK_ALERT_RADIUS_REACH: "reach",
  TRACK_ALERTING: "alerting",
  NAVIGATION: "navigation",
};

export const HITBOX_SIZE = 44;

export const maxRadiusInfoMessage = `Vous ne pouvez recevoir les alertes au delà d'un rayon de ${humanizeDistance(
  MAX_BASEUSER_DEVICE_TRACKING,
)} autour de votre position.
Si vous êtes Batman ou, plus probablement, un service de secours,
contactez-nous à ${supportEmail} pour débloquer la réception des alertes sur un rayon étendu.
Ce service est gratuit mais ne peut être activé que sur demande au cas par cas.`;

export const FOLLOW_PITCH = 60;

// Map contentInset (v11 ViewPadding): shifts the logical viewport center
export const Alignments = {
  Center: { top: 0, right: 0, bottom: 0, left: 0 },
  Bottom: { top: 300, right: 0, bottom: 0, left: 0 },
  Top: { top: 0, right: 0, bottom: 300, left: 0 },
};
