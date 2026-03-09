const circumference = 40075;
const oneDegreeOfLatitudeInMeters = 111.32 * 1000;

export default function regionFrom(lat, lon, distance) {
  distance = distance / 2;
  const angularDistance = distance / circumference;
  const latitudeDelta = distance / oneDegreeOfLatitudeInMeters;
  const longitudeDelta = Math.abs(
    Math.atan2(
      Math.sin(angularDistance) * Math.cos(lat),
      Math.cos(angularDistance) - Math.sin(lat) * Math.sin(lat),
    ),
  );
  return {
    latitude: lat,
    longitude: lon,
    latitudeDelta,
    longitudeDelta,
  };
}
