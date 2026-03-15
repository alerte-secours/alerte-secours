const GEOPLATEFORME_URL = "https://data.geopf.fr/geocodage";

export async function geoplatformeSearch(query) {
  const params = `q=${encodeURIComponent(
    query,
  )}&autocomplete=1&index=address&limit=5`;
  const res = await fetch(`${GEOPLATEFORME_URL}/search?${params}`, {
    headers: { "accept-language": "fr" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const features = data?.features || [];
  return features.map((feature) => ({
    latitude: feature.geometry.coordinates[1],
    longitude: feature.geometry.coordinates[0],
    displayName: feature.properties.label || "",
  }));
}

export async function geoplatformeReverse(lat, lon) {
  const params = `lon=${encodeURIComponent(lon)}&lat=${encodeURIComponent(
    lat,
  )}&index=address&limit=1`;
  const res = await fetch(`${GEOPLATEFORME_URL}/reverse?${params}`, {
    headers: { "accept-language": "fr" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const features = data?.features || [];
  if (features.length > 0) {
    return features[0].properties.label || null;
  }
  return null;
}
