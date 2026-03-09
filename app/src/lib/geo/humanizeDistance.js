import { ROUND_DISTANCE } from "./constants";
export default function humanizeDistance(distance, options = {}) {
  const { round = ROUND_DISTANCE } = options;

  distance = Math.round(distance / round) * round;
  if (distance < 1000) {
    return `${distance} m`;
  }
  return `${Math.round(distance / 100) / 10} km`;
}
