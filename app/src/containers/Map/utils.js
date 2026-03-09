import { getBoundsOfDistance } from "geolib";

export const calculateZoomLevelFromBounds = (bounds) => {
  const WORLD_DIM = { height: 256, width: 256 };
  const ZOOM_MAX = 20;

  function latRad(lat) {
    const sin = Math.sin((lat * Math.PI) / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  }

  function zoom(mapPx, worldPx, fraction) {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  }

  const latFraction = (latRad(bounds.ne.lat) - latRad(bounds.sw.lat)) / Math.PI;

  const lngDiff = bounds.ne.lng - bounds.sw.lng;
  const lngFraction = (lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360;

  const latZoom = zoom(WORLD_DIM.height, 256, latFraction);
  const lngZoom = zoom(WORLD_DIM.width, 256, lngFraction);

  return Math.min(Math.min(latZoom, lngZoom), ZOOM_MAX);
};

export const calculateZoomLevelFromRadius = (location, radius) => {
  const [sw, ne] = getBoundsOfDistance(location, radius);
  const bounds = {
    ne: { lng: ne.longitude, lat: ne.latitude },
    sw: { lng: sw.longitude, lat: sw.latitude },
  };
  return calculateZoomLevelFromBounds(bounds);
};
