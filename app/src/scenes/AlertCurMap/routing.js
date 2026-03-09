import env from "~/env";
import { createLogger } from "~/lib/logger";
import { FEATURE_SCOPES } from "~/lib/logger/scopes";

const routingLogger = createLogger({
  module: FEATURE_SCOPES.MAP,
  feature: "routing",
});

export const stepIcons = {
  "bear-left": require("~/assets/img/direction-bear-left.png"),
  "bear-right": require("~/assets/img/direction-bear-right.png"),
  continue: require("~/assets/img/direction-continue.png"),
  end: require("~/assets/img/direction-end.png"),
  "enter-roundabout": require("~/assets/img/direction-enter-roundabout.png"),
  fork: require("~/assets/img/direction-fork.png"),
  "merge-left": require("~/assets/img/direction-merge-left.png"),
  "merge-right": require("~/assets/img/direction-merge-right.png"),
  "ramp-left": require("~/assets/img/direction-ramp-left.png"),
  "ramp-right": require("~/assets/img/direction-ramp-right.png"),
  "sharp-left": require("~/assets/img/direction-sharp-left.png"),
  "sharp-right": require("~/assets/img/direction-sharp-right.png"),
  "turn-left": require("~/assets/img/direction-turn-left.png"),
  "turn-right": require("~/assets/img/direction-turn-right.png"),
  "u-turn": require("~/assets/img/direction-u-turn.png"),
  via: require("~/assets/img/direction-via.png"),
};

export const laneIcons = {
  left: require("~/assets/img/lane-left.png"),
  right: require("~/assets/img/lane-right.png"),
  "sharp-left": require("~/assets/img/lane-sharp-left.png"),
  "sharp-right": require("~/assets/img/lane-sharp-right.png"),
  "slight-left": require("~/assets/img/lane-slight-left.png"),
  "slight-right": require("~/assets/img/lane-slight-right.png"),
  straight: require("~/assets/img/lane-straight.png"),
  uturn: require("~/assets/img/lane-uturn.png"),
  "uturn-right": require("~/assets/img/lane-uturn-right.png"),
};

const camelCase = (e) => {
  for (var t = e.split(" "), a = "", n = 0, i = t.length; n < i; n++)
    a += t[n].charAt(0).toUpperCase() + t[n].substring(1);
  return a;
};

const maneuverToInstructionType = (maneuver, index) => {
  switch (maneuver.type) {
    case "new name":
      return "Continue";
    case "depart":
      return "Head";
    case "arrive":
      return index ? "DestinationReached" : "WaypointReached";
    case "roundabout":
    case "rotary":
      return "Roundabout";
    case "merge":
    case "fork":
    case "on ramp":
    case "off ramp":
      // case "end of road":
      return camelCase(maneuver.type);
    default:
      return camelCase(maneuver.modifier);
  }
};

const leftOrRight = (e) => {
  return e.indexOf("left") >= 0 ? "Left" : "Right";
};

const maneuverToModifier = (maneuver) => {
  let t = maneuver.modifier;
  switch (maneuver.type) {
    case "merge":
    case "fork":
    case "on ramp":
    case "off ramp":
    case "end of road":
      t = leftOrRight(t);
  }
  return t && camelCase(t);
};

export const getIconName = (step, index) => {
  const { maneuver } = step;

  const type = maneuverToInstructionType(maneuver, index);
  const modifier = maneuverToModifier(maneuver);

  // routingLogger.debug("Processing maneuver", { maneuver: JSON.stringify(maneuver, null, 2) });
  // routingLogger.debug("Instruction type", { type });

  switch (type) {
    case "Head":
      if (0 === index) return "depart";
      break;
    case "WaypointReached":
      // return "via";
      return "arrive";
    case "Roundabout":
      return "enter-roundabout";
    case "DestinationReached":
      return "arrive";
  }
  switch (modifier) {
    case "Straight":
      return "continue";
    case "SlightRight":
      return "bear-right";
    case "Right":
      return "turn-right";
    case "SharpRight":
      return "sharp-right";
    case "TurnAround":
    case "Uturn":
      return "u-turn";
    case "SharpLeft":
      return "sharp-left";
    case "Left":
      return "turn-left";
    case "SlightLeft":
      return "bear-left";
  }
};

export const stepToLanes = (step) => {
  let lanes = step.intersections[0].lanes;
  if (!lanes) return [];
  // main maneuver
  let maneuver = step.maneuver.modifier || "";
  // accumulative lane icon offset
  let offset = 0;
  // process each lane
  return lanes.flatMap((lane, index) => {
    let indicationOffset = offset;
    // draw icon for each allowed maneuver from this lane
    const laneIcons = lane.indications.map(
      (indication, indicationIndex, indications) => {
        let validIndication = lane.valid;
        if (lane.valid && maneuver !== indication && indications.length > 1) {
          // gray out inappropriate indication if there are a few ones for this lane
          if (
            maneuver === "straight" &&
            (indication === "none" || indication === "")
          ) {
            validIndication = true;
          } else if (maneuver.slice(0, 7) === "slight ") {
            // try to exclude 'slight' modifier
            validIndication = indication === maneuver.slice(7);
          } else {
            // try to add 'slight' modifier otherwise
            validIndication = indication === "slight " + maneuver;
          }
        }
        // transform lane indication into icon class
        let icon;
        if (indication === "none" || indication === "") icon = "straight";
        else if (indication === "uturn" && step.driving_side === "left")
          // use u-turn icon for left driving side
          icon = "uturn-right";
        else icon = indication.replace(" ", "-");
        // calcuate offset to draw each next icons in the same lane on the same place
        let iconPos = offset + indicationIndex;
        if (iconPos > indicationOffset) indicationOffset = iconPos;
        // create span element with necessary icon class
        return {
          icon,
          valid: validIndication,
          superposed: iconPos > 0,
        };
      },
    );
    // shift global offset for next lane
    if (indicationOffset > offset) offset = indicationOffset;
    return laneIcons;
  });
};

export const modeIcons = {
  // modes from https://github.com/Project-OSRM/osrm-backend/blob/3bb82ce1e2fd2299712b96176e651e6f7e999aae/src/extractor/scripting_environment_lua.cpp#L133
  walking: "walk",
  driving: "car",
  cycling: "bike",
  /*
  "inaccessible": "",
  "ferry": "",
  "train": "",
  "pushing_bike": "",
  "steps_up": "",
  "steps_down": "",
  "river_up": "",
  "river_down": "",
  "route": "",
  */
};

export const profileDefaultModes = {
  car: "driving",
  foot: "walking",
  bike: "cycling",
};

export const osmProfileUrl = {
  car: env.OSRM_CAR_URL,
  foot: env.OSRM_FOOT_URL,
  bicycle: env.OSRM_BICYCLE_URL,
};
