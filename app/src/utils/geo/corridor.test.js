import {
  toLonLat,
  computeCorridorQueryRadiusMeters,
  filterDefibsInCorridor,
} from "./corridor";

describe("geo/corridor", () => {
  test("toLonLat returns [lon, lat]", () => {
    expect(toLonLat({ latitude: 48.1, longitude: 2.2 })).toEqual([2.2, 48.1]);
  });

  test("computeCorridorQueryRadiusMeters matches segment/2 + corridor", () => {
    const user = [0, 0];
    const alert = [0, 1];
    const corridorMeters = 10_000;
    const radius = computeCorridorQueryRadiusMeters({
      userLonLat: user,
      alertLonLat: alert,
      corridorMeters,
    });

    // 1° latitude is ~111km. Half is ~55.5km, plus corridor.
    expect(radius).toBeGreaterThan(60_000);
    expect(radius).toBeLessThan(70_000);
  });

  test("filterDefibsInCorridor keeps points close to the segment", () => {
    const userLonLat = [0, 0];
    const alertLonLat = [0, 1];
    const corridorMeters = 10_000;

    const defibs = [
      // on the line
      { id: "on", latitude: 0.5, longitude: 0 },
      // ~0.1° lon at lat 0.5 is ~11km => outside 10km
      { id: "off", latitude: 0.5, longitude: 0.1 },
    ];

    const filtered = filterDefibsInCorridor({
      defibs,
      userLonLat,
      alertLonLat,
      corridorMeters,
    });

    expect(filtered.map((d) => d.id).sort()).toEqual(["on"]);
  });
});
