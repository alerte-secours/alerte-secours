import { OpenLocationCode } from "open-location-code";

const openLocationCode = new OpenLocationCode();

export default function getPlusCode(coordinates) {
  if (!coordinates || coordinates.length !== 2) {
    return null;
  }
  const [longitude, latitude] = coordinates;
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }
  return openLocationCode.encode(latitude, longitude);
}
