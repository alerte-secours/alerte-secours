export default function calculateDistance([lat1, long1], [lat2, long2]) {
  let p = 0.017453292519943295; // Math.PI / 180
  let c = Math.cos;
  let a =
    0.5 -
    c((lat1 - lat2) * p) / 2 +
    (c(lat2 * p) * c(lat1 * p) * (1 - c((long1 - long2) * p))) / 2;
  let dis = 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
  return dis;
}
